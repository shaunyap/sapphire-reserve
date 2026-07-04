# Chase Sapphire Reserve - Is It Worth It?

An interactive, offline-first personal finance dashboard to calculate the real net return on investment (ROI) of the **Chase Sapphire Reserve (CSR)** credit card.

## 🚀 Key Features

* **Interactive ROI Calculator**: Compare your total personal utility value against the **$795 annual fee** (plus any authorized users at **$195 each**) to find your true net yield.
* **Granular Perk Valuations**: Fine-tune personal valuations for standard card perks (DoorDash, Lyft Pink, Lyft ride credits, Priority Pass, Apple Music, Apple TV+, Sapphire Dining, "The Edit" Hotel Credits, etc.) using bidirectional snapping sliders.
* **Chase CSV Statement Importer**: Import raw transaction statement exports directly from Chase. The engine automatically parses transactions, nets out returns, and aggregates earnings:
  * **Points Multipliers**: Dining (3x), Lyft rides (5x), Chase Portal Travel (8x), Direct Travel (4x), and General (1x).
  * **Counter Perks**: Automatically tallies active months for Lyft credits, counts Priority Pass lounge visits, and registers hotel/dining credit uses.
  * **Chase Offers Integration**: Automatically scans for Chase statement offers (e.g. WHOOP, Disney+, eBay) and provisions them as active custom perks.
* **Flat 2% Cashback Card Comparison**: Compares the CSR's Net ROI against a flat, no-annual-fee 2% cashback card based on the exact same cash spending transactions. Know instantly whether your points strategy is outperforming a simple cash-back alternative.
* **Visual Value Comparison**: A stacked progress chart comparing your Annual Fee outlay, Face (Retail) Value collected, and derived Personal Value.
* **Privacy First**: 100% client-side. Your financial data is saved purely in your browser's local storage (`localStorage`). No servers, no tracking, and no external APIs.

---

## 🛠️ Getting Started

### Prerequisites
To run this application locally, you just need a web browser. A local web server is recommended for loading asset scripts and stylesheets cleanly.

### Running Locally
1. Clone this repository:
   ```bash
   git clone https://github.com/shaunyap/sapphire-reserve.git
   cd sapphire-reserve
   ```
2. Spin up a simple HTTP server (e.g., using Python):
   ```bash
   python3 -m http.server 8080
   ```
3. Open your browser and navigate to:
   **[http://localhost:8080](http://localhost:8080)**

---

## 🔒 Security & Privacy

* **Zero Network Calls**: All statement parsing, math calculations, and state loading happen locally inside your browser sandboxed environment. Your credit card statement data **never leaves your machine**.
* **Hardened Gitignore**: The repository is configured to globally ignore all `.csv` and `.json` files. Even if you save statement exports inside the repository directory (e.g. in `/data`), Git will prevent them from being checked in or pushed to GitHub.

---

## 📊 Chase CSV Importer Details

The importer processes the standard Chase activity export file headers (`Transaction Date`, `Description`, `Category`, `Type`, `Amount`) and maps them using the following rules:

1. **Multiplier Categories**:
   * **5x Points**: Lyft transactions.
   * **8x Points**: Chase Travel transactions.
   * **3x Points**: General Dining (excluding Chase Travel).
   * **4x Points**: Direct Travel (excluding Chase Portal).
   * **1x Points**: All other general categories.
2. **Standard Statement Credits**:
   * Auto-detects `$300 Travel Credit` allocations and updates the annual travel credit perk values.
   * Auto-detects Sapphire Dining credit redemptions (up to 2x $150).
   * Auto-detects "The Edit" hotel booking credits (up to 2x $250).
3. **Chase Offers**:
   * Scans descriptions starting with `Offer:` (such as WHOOP, eBay, Disney+) and automatically imports them as custom toggle-based statement credits.

---

## 💾 State Backups

You can export a backup of your customized valuations and logged transactions by clicking the **Export Data** button in the header. This saves a `.json` backup file. You can load this backup on any other device/browser by clicking **Import Data**.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
