// useBusinessInfo.js
import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "apiService";

export default function useBusinessInfo() {
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");

    useEffect(() => {
        api
            .get("/api/business-info", { withCredentials: true })
            .then((res) => {
                setCity(res.data.city || "");
                setCountry(res.data.country || "");
            })
            .catch((err) => console.error("Business-info error", err));
    }, []);

    return { city, country };
}
