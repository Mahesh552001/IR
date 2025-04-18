import "./App.css";
import { useState } from "react";
import {
  TextField,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import logo from "/wines.jpg";
import { CircularProgress } from "@mui/material";

function App() {
  const [value, setValue] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [queryExpandValue, setQueryExpandValue] = useState("");
  const [queryExpand, setQueryExpand] = useState(false);
  const [queryDisabled, setQueryDisabled] = useState(false);
  const [clusterDisabled, setClusterDisabled] = useState(false);
  const [finalData, setFinalData] = useState([]);
  const [radioValue, setRadioValue] = useState("page_ranking");
  const [radioRestValue, setRestRadioValue] = useState("");
  const [googleResults, setGoogleResults] = useState([]);
  const [bingResults, setBingResults] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [bingLoading, setBingLoading] = useState(false);
  const [solrLoading, setSolrLoading] = useState(false);

  const handleRadioChange = (event) => {
    const val = event.target.value;
    setRadioValue(val);
    const isHITS = val === "hits";
    setQueryDisabled(isHITS);
    setClusterDisabled(isHITS);
  };

  const handleRestRadioChange = (event) => {
    setRestRadioValue(event.target.value);
  };

  const handleTextInput = (e) => {
    setValue(e.target.value);
  };

  const handleSearch = async () => {
    if (!value.trim()) {
      alert("Input cannot be empty, please enter a non-empty string!");
      return;
    }
    setShowResult(true);

    await fetchSolrResults(value);
    await fetchGoogleResults(value);
    await fetchBingResults(value);
  };

  const fetchSolrResults = async (query) => {
    setSolrLoading(true);
    try {
      const solrResponse = await fetch(
        "http://localhost:5000/api/solr-search",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );
      const solrData = await solrResponse.json();

      const docs =
        solrData.results?.map((doc, idx) => ({
          id: doc.id,
          title: doc.title?.[0] || "Untitled",
          url: doc.url?.[0] || doc.id,
          meta_info: doc.content?.[0]?.slice(0, 300) || "No preview available",
          rank: idx + 1,
        })) || [];

      setFinalData(docs);

      const expanded_query = solrData.expanded_query;
      if (expanded_query) {
        setQueryExpand(true);
        setQueryExpandValue(expanded_query);
      }
    } catch (error) {
      console.error("Error fetching Solr results:", error);
    } finally {
      setSolrLoading(false); // End loading
    }
  };

  const fetchBingResults = async (query) => {
    setBingLoading(true); // Start loading
    try {
      const response = await fetch("http://localhost:5000/api/bing-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      console.log("Bing results via Node backend:", data);

      // Update this to handle 'results' as per the updated backend structure
      if (data.results) {
        setBingResults(data.results); // Update the results in the state
      } else {
        setBingResults([]); // If no results, clear the state
      }
    } catch (error) {
      console.error("Failed to fetch Bing results from Node backend", error);
      setBingResults([]); // In case of error, clear the results
    } finally {
      setBingLoading(false); // End loading
    }
  };

  const fetchGoogleResults = async (query) => {
    const apiKey = "AIzaSyBawtMxKL7lUSzn0HHFi9s7j1OvHZ_LOiQ";
    const cx = "a1fba1316e927435a";
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
      query
    )}`;
    setGoogleLoading(true); // Start loading

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.items) {
        setGoogleResults(data.items);
      } else {
        setGoogleResults([]);
      }
    } catch (error) {
      console.error("Failed to fetch Google results:", error);
      setGoogleResults([]);
    } finally {
      setGoogleLoading(false); // End loading
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <Box className="search-bar-group">
          <img src={logo} alt="logo" style={{ marginRight: 16, height: 40 }} />
          <TextField
            className="search-bar"
            label="Enter text to search"
            value={value}
            onChange={handleTextInput}
            variant="outlined"
            color="primary"
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            className="search-button"
          >
            Search
          </Button>
        </Box>

        {/* Configurations */}
        <Box
          className="config-box"
          sx={{ border: "1px solid black", borderRadius: 2, p: 2 }}
        >
          <Typography variant="h6" gutterBottom color="primary">
            Configuration
          </Typography>
          <RadioGroup value={radioValue} onChange={handleRadioChange}>
            <FormControlLabel
              value="page_ranking"
              control={<Radio />}
              label="Page Ranking"
            />
            <FormControlLabel value="hits" control={<Radio />} label="HITS" />
          </RadioGroup>

          <Typography variant="h6" gutterBottom color="primary">
            Clustering
          </Typography>
          <RadioGroup value={radioRestValue} onChange={handleRestRadioChange}>
            <FormControlLabel
              value="flat_clustering"
              control={<Radio />}
              label="Flat clustering (KMeans)"
              disabled={clusterDisabled}
            />
            <FormControlLabel
              value="single_link"
              control={<Radio />}
              label="Agglomerative (Single link)"
              disabled={clusterDisabled}
            />
            <FormControlLabel
              value="complete_link"
              control={<Radio />}
              label="Agglomerative (Complete Link)"
              disabled={clusterDisabled}
            />
          </RadioGroup>

          <Typography variant="h6" gutterBottom color="primary">
            Query expansion
          </Typography>
          <RadioGroup value={radioRestValue} onChange={handleRestRadioChange}>
            <FormControlLabel
              value="rocchio_algorithm"
              control={<Radio />}
              label="Rocchio algorithm"
              disabled={queryDisabled}
            />
            <FormControlLabel
              value="associative_cluster"
              control={<Radio />}
              label="Associative clusters"
              disabled={queryDisabled}
            />
            <FormControlLabel
              value="metric_cluster"
              control={<Radio />}
              label="Metric clusters"
              disabled={queryDisabled}
            />
            <FormControlLabel
              value="scalar_cluster"
              control={<Radio />}
              label="Scalar clusters"
              disabled={queryDisabled}
            />
          </RadioGroup>
        </Box>

        {/* Results */}
        {showResult && (
          <div className="boxes-container">
            <div className="result-box-item">
              <Typography variant="h6" color="primary">
                Our results
              </Typography>
              {queryExpand && (
                <Typography variant="subtitle1">
                  Expanded query: {queryExpandValue}
                </Typography>
              )}
              {solrLoading ? (
                <CircularProgress />
              ) : (
                finalData.map((doc) => (
                  <Card key={doc.id} sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {doc.title}
                        </a>
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        {doc.meta_info.split(" ").slice(0, 20).join(" ")}...
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <div className="result-box-item">
              <Typography variant="h6" color="primary">
                Google results
              </Typography>
              {googleLoading ? (
                <CircularProgress />
              ) : (
                googleResults.map((item, index) => (
                  <Card key={index} sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.title}
                        </a>
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        {item.snippet}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div className="result-box-item">
              <Typography variant="h6" color="primary">
                Bing results
              </Typography>
              {bingLoading ? (
                <CircularProgress />
              ) : (
                bingResults.map((item, index) => (
                  <Card key={index} sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6">
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.title}
                        </a>
                      </Typography>
                      <Typography variant="subtitle2" color="textSecondary">
                        {item.snippet ||
                          item.snippet_highlighted_words?.join(" ") ||
                          ""}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
