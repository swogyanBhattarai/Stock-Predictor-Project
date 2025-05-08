// utils/api.ts
export const uploadFile = async (file: File): Promise<{ message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
  
    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });
  
    if (!res.ok) {
      throw new Error("Upload failed");
    }
  
    return await res.json();
  };
  