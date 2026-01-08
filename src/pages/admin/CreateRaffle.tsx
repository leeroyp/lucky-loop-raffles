import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Ticket, Calendar } from "lucide-react";

const raffleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  endAt: z.string().min(1, "End date is required"),
});

// Simple hash function for browser
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Generate random seed
function generateSeed(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

export default function CreateRaffle() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [endAt, setEndAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const data = {
        title,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        endAt,
      };

      raffleSchema.parse(data);

      // Generate seed and hash
      const seed = generateSeed();
      const seedHash = await sha256(seed);

      const { data: raffleData, error } = await supabase
        .from("raffles")
        .insert({
          title,
          description: description || null,
          image_url: imageUrl || null,
          end_at: new Date(endAt).toISOString(),
          seed,
          seed_hash: seedHash,
          status: "DRAFT",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Raffle created!",
        description: "Your raffle has been saved as a draft.",
      });

      navigate(`/admin/raffles/${raffleData.id}`);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error creating raffle",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // Get min datetime (now + 1 hour)
  const minDateTime = new Date(Date.now() + 3600000).toISOString().slice(0, 16);

  return (
    <Layout>
      <div className="min-h-screen py-24">
        <div className="container px-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => navigate("/admin")}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                <Ticket className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Create New Raffle</h1>
                <p className="text-muted-foreground">
                  Set up a new raffle with provably fair draw
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., iPhone 15 Pro Giveaway"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the prize and any rules..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              {/* Image Upload */}
              <ImageUpload value={imageUrl} onChange={setImageUrl} />

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="endAt" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date & Time *
                </Label>
                <Input
                  id="endAt"
                  type="datetime-local"
                  min={minDateTime}
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
                {errors.endAt && (
                  <p className="text-sm text-destructive">{errors.endAt}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> A cryptographic seed will be generated
                  automatically. The seed hash will be published when the raffle
                  goes live, and the actual seed will be revealed after the draw
                  for verification.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Raffle"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
