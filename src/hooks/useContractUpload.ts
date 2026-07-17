import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContractUpload() {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: async ({ file, employeeId, contractId }: { file: File; employeeId: string; contractId: string }) => {
      const path = `${employeeId}/${contractId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("employee_contracts")
        .update({ document_url: path })
        .eq("id", contractId);
      if (updateError) throw updateError;

      return path;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-contracts"] });
    },
  });

  const getSignedUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("contracts")
      .createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  };

  return { upload, getSignedUrl };
}
