document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-imagen");
  const imageUrlInput = document.getElementById("url-imagen");
  const imagen = document.getElementById("imagen");
  const descripcion = document.getElementById("descripcion");
  const confianza = document.getElementById("confianza");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const imageUrl = imageUrlInput.value.trim();
    if (!imageUrl) return;

    // Mostrar estado de carga
    descripcion.textContent = "Analizando imagen...";
    confianza.textContent = "";
    imagen.src = "";
    imagen.alt = "";

    try {
      const response = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: imageUrl }),
      });

      if (!response.ok) {
        let errorMessage = "Error al analizar";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (_) {
          // Si no es JSON válido
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.description && data.description.captions && data.description.captions.length > 0) {
        const caption = data.description.captions[0];
        imagen.src = imageUrl;
        imagen.alt = caption.text;
        descripcion.textContent = `Descripción: ${caption.text}`;
        confianza.textContent = `Confianza: ${Math.round(caption.confidence * 100)}%`;
      } else {
        descripcion.textContent = "No se pudo obtener una descripción de la imagen.";
        confianza.textContent = "";
      }
    } catch (error) {
      console.error(`Error analizando la imagen: ${error.message}`);
      descripcion.textContent = `Error: ${error.message}`;
      confianza.textContent = "";
    }
  });
});
