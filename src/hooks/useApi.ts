import { useCallback, useState } from "react";
import { getErrorMessage } from "../services/api";

export const useApi = <T,>(fn: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  return { data, loading, error, run, setData };
};
