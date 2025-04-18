const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const SERP_API_KEY =
  "1e1c90dc6aeda170840b16ae8f8d11f0884581e55c526e860d868ca6c2045494";

const SOLR_URL = "http://localhost:8983/solr/mycore/select";

app.post("/api/solr-search", async (req, res) => {
  const { query = "*:*", start = 0, rows = 50 } = req.body;

  try {
    console.log(
      `${SOLR_URL}?q=${encodeURIComponent(
        query
      )}&wt=json&defType=edismax&qf=title`
    );
    const { data } = await axios.get(
      `${SOLR_URL}?q=${encodeURIComponent(
        query
      )}&wt=json&defType=edismax&qf=title`
    );

    res.json({
      results: data.response.docs,
      total: data.response.numFound,
      expanded_query: null,
    });
  } catch (error) {
    console.error("Solr query failed:", error.message);
    res.status(500).json({ error: "Failed to fetch Solr results" });
  }
});

app.post("/api/bing-search", async (req, res) => {
  const query = req.body.query;
  const params = {
    engine: "bing",
    q: query,
    api_key: SERP_API_KEY,
    count: 20,
  };

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params,
    });

    const results = response.data.organic_results.map((result) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      thumbnail: result.thumbnail || "",
    }));

    res.json({ results });
  } catch (error) {
    console.error("Error fetching from SerpAPI:", error.message);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
