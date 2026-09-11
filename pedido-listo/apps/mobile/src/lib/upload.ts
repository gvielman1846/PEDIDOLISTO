/**
 * React Native no puede construir un Blob desde ArrayBuffer, que es lo que hace
 * uploadString por dentro. Los Blob que crea XMLHttpRequest si son validos y son
 * los que acepta uploadBytes, asi que la foto se lee desde su uri local.
 */
export function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      const blob = xhr.response as Blob | null;

      if (!blob || blob.size === 0) {
        reject(new Error('La foto se leyo vacia. Intenta elegirla de nuevo.'));
        return;
      }

      resolve(blob);
    };
    xhr.onerror = () => reject(new Error('No se pudo leer la foto seleccionada.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}
