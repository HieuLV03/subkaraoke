import { supabase } from "@/lib/supabase";

export async function uploadImage(file) {
  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filePath, file);

  if (error) {
    console.log("Upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage
    .from("images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}