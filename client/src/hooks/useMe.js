import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

const useMe = () => {
  const hasFetched = useRef(false);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchMe();
  }, []);

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/user/mine');
      setMe(res.data.data);
    } catch (e) {
      setError('유저 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return { me, loading, error };
};

export default useMe;