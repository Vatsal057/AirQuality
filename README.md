# Bangalore Air Quality Analysis & Pollution Hotspot Identification

**[Explore the findings interactively →](https://vatsal057.github.io/AirQuality/)** — every station on a map, the model comparison, and the consensus hotspots.

Data-mining project that analyzes a year of daily AQI data from Bengaluru's CPCB/KSPCB monitoring stations (2024) to identify pollution hotspots using unsupervised machine learning.

The headline: the worst and cleanest station sit **57 AQI points apart** on a yearly mean, so a city-wide average is close to meaningless. Two stations — RVCE-Mailasandra and Silk Board — are flagged as hotspots by all three algorithms. Silk Board hit AQI 500, the ceiling of the index.

City-wide AQI averages hide how uneven urban pollution really is — a traffic junction like Silk Board and a leafy suburb like Jayanagar live in different micro-climates. This project clusters stations by their pollution behavior and flags the ones that deviate as hotspots.

## Approach

1. **Ingestion** — consolidate non-standardized CPCB/KSPCB Excel exports (wide day×month format) into a long-format time series
2. **Feature engineering** — summarize each station's yearly behavior (level, variability, seasonal patterns) into a feature vector
3. **Clustering** — compare K-Means (elbow method, K=4), hierarchical clustering, and DBSCAN; DBSCAN's noise points surface the extreme hotspots that K-Means dilutes into a "high" cluster
4. **Reporting** — ranked hotspot report and visualizations

## Repository layout

- `Air Quality Analysis.ipynb` — the full pipeline as a standalone notebook
- `data/raw/` — daily AQI Excel exports per station (CPCB/KSPCB public data)
- `data/processed/`, `data/features/` — cleaned long-format data and feature matrix
- `results/` — final analysis CSVs, model comparison, hotspot report, visualizations
- `Project_History.md` — detailed implementation log and decisions
- `Air Quality Analysis.docx` / `Air Quality Hotspot.pptx` — report and presentation

## Run it

```sh
pip install -r requirements.txt
jupyter notebook "Air Quality Analysis.ipynb"
```

## Data source

Daily AQI values from the CPCB CAAQMS portal and KSPCB, Jan–Dec 2024. All data is public.

14 station exports were collected; 13 carry complete 2024 coverage and form the feature matrix. The Kadabesanahalli export only covers 2023, so it is kept in `data/raw/` for provenance but dropped in the notebook rather than compared across years.

## License

MIT
