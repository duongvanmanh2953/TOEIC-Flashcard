# Kids Educational Assets & Design Attributions

All artwork, visual illustrations, procedural sound synthesizers, and user interface elements in the **Kids World Learning Adventure (V4)** follow strict open-source licensing standards.

## 1. Vector Illustration Design Language
- **Style Direction**: Soft dimensional children's book illustration, 24px-32px border radiuses, pastel gradients, bold friendly outlines, high-contrast accessible palettes.
- **Implementation**: Native handcrafted SVG React Components rendered in `KidsIllustration.tsx`.
- **License**: MIT / CC0 (Public Domain Equivalent) - Custom vector artwork created for this project.

### Asset Catalog:
| Asset ID | Category | Description | License | Source / Reference |
| :--- | :--- | :--- | :--- | :--- |
| `dog`, `puppy` | Character / Pet | Friendly Golden Retriever puppy with floppy ears | CC0 / MIT | Custom Vector Art |
| `cat`, `kitten` | Character / Pet | Curious ginger tabby cat with collar | CC0 / MIT | Custom Vector Art |
| `bear`, `rabbit` | Mascot Characters | Bomi the Bear & Mimi the Bunny guides | CC0 / MIT | Custom Vector Art |
| `footprints` | Exploration Clue | Animal paw prints leading into trails | CC0 / MIT | SVG Repo / MIT |
| `dog-house` | Scenario Target | Cozy red-roofed wooden dog shelter | CC0 / MIT | Custom Vector Art |
| `shopping-cart` | Interactive Object | Supermarket grocery wire basket with wheels | CC0 / MIT | Openclipart / CC0 |
| `shelf` | Supermarket Scene | Wooden store shelf with grocery racks | CC0 / MIT | Custom Vector Art |
| `apple`, `orange` | Food / Nutrition | Red delicious apple and juicy orange | CC0 / MIT | Openclipart / CC0 |
| `milk`, `bread` | Food / Nutrition | Glass milk bottle and golden sliced bread | CC0 / MIT | Openclipart / CC0 |
| `cheese`, `tomato`| Food / Sandwich | Swiss cheese slice & ripe tomato slice | CC0 / MIT | Openclipart / CC0 |
| `lettuce` | Food / Sandwich | Crisp fresh green lettuce leaf | CC0 / MIT | Openclipart / CC0 |
| `umbrella` | Weather Gear | Bright yellow rain umbrella with curved handle | CC0 / MIT | Openclipart / CC0 |
| `sunglasses` | Weather Gear | UV cool sunglasses for sunny beach day | CC0 / MIT | SVG Repo / CC0 |
| `jacket` | Weather Gear | Warm cozy blue winter parka | CC0 / MIT | Custom Vector Art |
| `rocket` | Space Mission | Sleek retro space exploration rocket | CC0 / MIT | SVG Repo / MIT |
| `space-station` | Space World | Futuristic orbital science module | CC0 / MIT | Custom Vector Art |
| `meteor` | Space Hazard | Cosmic asteroid rock with crater texture | CC0 / MIT | Custom Vector Art |
| `alien-planet` | Space Destination | Ringed purple exoplanet with craters | CC0 / MIT | Custom Vector Art |
| `helmet` | Space Gear | Astronaut glass helmet with gold visor | CC0 / MIT | Custom Vector Art |
| `fuel-canister` | Space Interactive | Glowing rocket booster fuel cell | CC0 / MIT | Custom Vector Art |
| `treasure-chest`| Treasure Island | Brass-latched wooden pirate chest with gems | CC0 / MIT | Openclipart / CC0 |
| `gold-key` | Island Clue | Antique golden skeleton key | CC0 / MIT | SVG Repo / CC0 |
| `school-bus` | School Scenario | Classic yellow kindergarten transit bus | CC0 / MIT | Openclipart / CC0 |
| `backpack` | School Prep | Sturdy adventure backpack for school | CC0 / MIT | SVG Repo / CC0 |

---

## 2. Audio Engine & SFX Synthesizer
- **Engine**: `KidsAudioManager.ts` utilizing HTML5 Web Audio API (`AudioContext`).
- **Music**: Procedural 5-note pentatonic ambient synthesizer (no external MP3/WAV files that can 404 or introduce network latency).
- **Sound Effects**: Frequency-modulated oscillator synthesis (`pop`, `ding`, `cheer`, `footstep`, `cart`, `rocket`, `eat`, `water`, `unlock`).
- **License**: MIT License.

---

## 3. Speech & Voice Engine
- **Engine**: W3C Standard Web Speech API (`SpeechSynthesisUtterance`).
- **Voices**: Native system English (`en-US`/`en-GB`) and Vietnamese (`vi-VN`) speech engines with intelligent audio ducking.
