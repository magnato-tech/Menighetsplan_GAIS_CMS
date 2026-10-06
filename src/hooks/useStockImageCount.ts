import { useEffect, useState } from "react";
import { listStockImages } from "../services/stockImages";

/**
 * How many images come with the app (see services/stockImages.ts). Zero until the list has
 * been fetched, and if it cannot be: the number is a help in the menu, not something to wait for.
 */
export function useStockImageCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = true;
    listStockImages()
      .then((images) => current && setCount(images.length))
      .catch((error) => console.error("Bildene som følger med, kunne ikke telles:", error));
    return () => {
      current = false;
    };
  }, []);
  return count;
}
