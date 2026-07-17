import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAvatarUpload() {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: async ({ file, partnerId }: { file: File; partnerId: string }) => {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${partnerId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase
        .from("partners")
        .update({ avatar_url: urlData.publicUrl })
        .eq("id", partnerId);
      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-profile"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from("partners")
        .update({ avatar_url: null })
        .eq("id", partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-profile"] });
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });

  return { upload, remove };
}
