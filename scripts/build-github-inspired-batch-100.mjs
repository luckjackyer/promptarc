import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "content-pipeline");
const batchName = "github-inspired-batch-100";

const sourceNotes = [
  {
    label: "GitHub prompt repository pattern: cinematic subject + lens + texture + negative constraints",
    url: "https://github.com/search?q=midjourney+stable+diffusion+prompts&type=repositories"
  },
  {
    label: "GitHub prompt repository pattern: text-to-image dataset style tags and negative prompts",
    url: "https://github.com/search?q=text-to-image+prompt+dataset&type=repositories"
  },
  {
    label: "GitHub prompt repository pattern: awesome prompt collections for role, format, and quality constraints",
    url: "https://github.com/search?q=awesome+prompts+image+generation&type=repositories"
  }
];

const negativeByCategory = {
  architecture: "no famous landmark, no readable signage, no logo, no distorted perspective, no oversmoothed render",
  character: "no existing IP, no logo, no extra limbs, no copied mascot, no unreadable text",
  editorial: "no celebrity resemblance, no logo, no readable brand text, no watermark, no overpolished AI skin",
  experimental: "no watermark, no fake readable text, no chaotic clutter, no copied artist signature",
  infographic: "no tiny unreadable labels, no false claims, no logos, no dense clutter, no real private data",
  product: "no brand logo, no readable fake text, no duplicated product, no warped packaging, no watermark",
  poster: "no real event names, no logos, no copied brand style, no unreadable fake text, no watermark",
  ui: "no real brand names, no unreadable microcopy, no impossible navigation, no logos, no broken device frame"
};

const sizeByRatio = {
  "1:1": "1024x1024",
  "4:5": "1024x1536",
  "16:9": "1536x1024",
  "3:2": "1536x1024",
  "9:16": "1024x1536"
};

const items = [
  ["gh-cyanotype-deep-sea-specimens", "Cyanotype Deep Sea Specimens", "experimental", ["cyanotype", "marine", "specimen"], "Design a cyanotype plate of fictional deep sea specimens arranged like a 19th century scientific archive, translucent fins, pin shadows, salt stains, handwritten-like marks kept abstract, uneven paper exposure, and museum-flat composition.", "4:5"],
  ["gh-desert-radio-observatory-night", "Desert Radio Observatory Night", "architecture", ["observatory", "desert", "night"], "Render a remote desert radio observatory at midnight from a low wide-angle camera, dish silhouettes against dense stars, red safety lights, wind-carved sand, long exposure realism, and a quiet scientific mood.", "16:9"],
  ["gh-folded-paper-city-map", "Folded Paper City Map", "infographic", ["paper map", "city", "wayfinding"], "Create a folded paper city map for a fictional walkable neighborhood, isometric blocks, transit lines, tiny parks, coffee stops, soft crease shadows, limited ink palette, and clear route hierarchy without real place names.", "1:1"],
  ["gh-retro-future-kitchen-console", "Retro Future Kitchen Console", "product", ["retro future", "kitchen", "appliance"], "Create a product concept shot of an unbranded retro-future kitchen console, rounded enamel body, analog knobs, small glowing display shapes, chrome trim, avocado and cream palette, three-quarter view, studio catalog lighting.", "4:5"],
  ["gh-noir-elevator-storyboard", "Noir Elevator Storyboard", "poster", ["noir", "storyboard", "cinematic"], "Create a six-frame silent noir storyboard of a mysterious elevator ride, hard shadows, tilted camera angles, raincoat silhouette, flickering floor lights, ink wash texture, and clear sequential pacing with no dialogue bubbles.", "4:5"],
  ["gh-bioplastic-shoe-material-board", "Bioplastic Shoe Material Board", "product", ["shoe", "material", "sustainable"], "Create a footwear material board for an unbranded bioplastic running shoe concept, translucent sole slices, woven upper swatches, exploded components, pinned notes as abstract marks, and clean industrial design presentation.", "4:5"],
  ["gh-medieval-robot-scriptorium", "Medieval Robot Scriptorium", "character", ["robot", "medieval", "manuscript"], "Illustrate an original small robot monk copying illuminated manuscripts inside a candlelit scriptorium, brass joints, parchment dust, tiny mechanical quill, warm gothic arches, whimsical but not cartoonish storybook detail.", "4:5"],
  ["gh-satellite-farm-irrigation-diagram", "Satellite Farm Irrigation Diagram", "infographic", ["farm", "satellite", "irrigation"], "Build a technical infographic showing a fictional smart farm irrigation system from satellite scan to soil sensor to water valve, with layered field map, arrows, modular callouts, and readable visual hierarchy.", "16:9"],
  ["gh-ceramic-headphones-still-life", "Ceramic Headphones Still Life", "product", ["headphones", "ceramic", "still life"], "Create an editorial product still life of unbranded ceramic-shell headphones on a rough plaster plinth, soft directional window light, subtle glaze imperfections, braided cable curve, and restrained luxury composition.", "4:5"],
  ["gh-opera-house-costume-rack", "Opera House Costume Rack", "photography", ["costume", "opera", "backstage"], "Create a documentary backstage photograph of an opera house costume rack, velvet capes, numbered blank hang tags, dust in stage light, mirrors at oblique angle, and quiet pre-performance atmosphere.", "3:2"],
  ["gh-handheld-game-weather-app", "Handheld Game Weather App", "ui", ["weather", "handheld", "pixel UI"], "Design a weather app interface for a fictional handheld game device, chunky pixel icons, tactile buttons, weekly forecast cards, cozy storm palette, clear navigation states, and believable screen reflections.", "4:5"],
  ["gh-archaeology-field-kit-flatlay", "Archaeology Field Kit Flatlay", "photography", ["archaeology", "field kit", "flat lay"], "Create a top-down archaeology field kit photo with brushes, calipers, linen bags, clay shards, gridded notebook with unreadable marks, warm dust, hard noon shadows, and careful catalog spacing.", "1:1"],
  ["gh-liquid-metal-lettering-study", "Liquid Metal Lettering Study", "experimental", ["lettering", "metal", "typography"], "Create a liquid metal lettering study where large abstract serif forms bend like mercury over black glass, razor highlights, distorted reflections, macro close-up crop, and high contrast editorial drama.", "4:5"],
  ["gh-solarpunk-bus-stop-morning", "Solarpunk Bus Stop Morning", "architecture", ["solarpunk", "bus stop", "urban"], "Render a solarpunk neighborhood bus stop at morning rush, green roof, solar glass canopy, repairable modular benches, cyclists in soft silhouette, rainwater channel details, and optimistic urban realism.", "16:9"],
  ["gh-forest-mycology-field-guide", "Forest Mycology Field Guide", "infographic", ["mushroom", "field guide", "forest"], "Create a fictional mycology field guide page with mushroom silhouettes, spore print textures, habitat mini-scenes, cross-section diagrams, and compact label blocks that remain visually readable.", "4:5"],
  ["gh-velvet-sneaker-launch", "Velvet Sneaker Launch", "product", ["sneaker", "velvet", "launch"], "Create a dramatic product launch image for an unbranded velvet sneaker, low side angle, theatrical burgundy backdrop, single ribbon prop, crisp sole detail, premium shadows, and ad-safe negative space.", "4:5"],
  ["gh-sci-fi-greenhouse-control-room", "Sci Fi Greenhouse Control Room", "architecture", ["greenhouse", "sci-fi", "control room"], "Create a cinematic interior of a spacecraft greenhouse control room, curved glass, hydroponic towers, condensation, glowing growth charts as abstract panels, astronaut gloves on console, and believable lived-in sci-fi.", "16:9"],
  ["gh-risograph-repair-cafe-poster", "Risograph Repair Cafe Poster", "poster", ["risograph", "repair cafe", "community"], "Design a risograph-style poster visual for a fictional repair cafe, oversized kettle and screwdriver shapes, misregistered ink layers, friendly community energy, blank headline block, and rough recycled paper texture.", "4:5"],
  ["gh-origami-dragon-instruction-sheet", "Origami Dragon Instruction Sheet", "infographic", ["origami", "dragon", "instruction"], "Create an origami instruction sheet for a fictional paper dragon, twelve clear fold stages, blue guide arrows, paper texture, final tiny dragon pose, and uncluttered educational layout.", "4:5"],
  ["gh-quiet-luxury-perfume-rain", "Quiet Luxury Perfume Rain", "product", ["perfume", "rain", "luxury"], "Create a quiet luxury perfume bottle scene with no branding, rain-speckled stone ledge, grey silk, diffused daylight, transparent liquid refraction, minimal prop count, and high-end editorial restraint.", "4:5"],
  ["gh-cave-hotel-sectional-diagram", "Cave Hotel Sectional Diagram", "infographic", ["hotel", "section", "architecture"], "Create a sectional architectural diagram of a fictional cave hotel carved into soft limestone, rooms, ventilation shafts, courtyard pool, service paths, and warm earth-toned rendering with concise callout zones.", "16:9"],
  ["gh-puppet-space-captain-sheet", "Puppet Space Captain Sheet", "character", ["puppet", "space", "character sheet"], "Design an original felt puppet space captain character sheet, front, side, expressions, tiny helmet, stitched fabric seams, toy-like proportions, neutral background, and no existing franchise resemblance.", "1:1"],
  ["gh-woodblock-noodle-labels", "Woodblock Noodle Labels", "typography", ["woodblock", "noodle", "labels"], "Create a sheet of fictional noodle package labels in a woodblock print style, bold bowls, steam motifs, imperfect ink edges, blank brand blocks, and varied label shapes without readable real language.", "4:5"],
  ["gh-cybernetic-plant-portrait", "Cybernetic Plant Portrait", "experimental", ["plant", "cybernetic", "macro"], "Create a macro portrait of a fictional cybernetic plant, translucent leaves with tiny circuit veins, dew drops, black laboratory background, botanical realism mixed with subtle speculative hardware, and shallow depth of field.", "1:1"],
  ["gh-museum-audio-guide-ui", "Museum Audio Guide UI", "ui", ["museum", "audio guide", "mobile UI"], "Design a mobile museum audio guide screen, exhibit card stack, room progress path, audio waveform, accessible controls, muted gallery palette, and realistic thumb-friendly spacing.", "4:5"],
  ["gh-alpine-cheese-cellar-photo", "Alpine Cheese Cellar Photo", "photography", ["cheese", "cellar", "documentary"], "Create a documentary photo inside an alpine cheese aging cellar, wooden shelves, chalky rind textures, worker hands partially visible, cool damp air, single shaft of light, and natural imperfections.", "3:2"],
  ["gh-pop-up-weather-station-kit", "Pop Up Weather Station Kit", "product", ["weather", "kit", "field gear"], "Create a product layout for an unbranded pop-up weather station kit, collapsible mast, sensors, rugged case, instruction cards with abstract marks, field grass background, and practical outdoor lighting.", "4:5"],
  ["gh-dreamlike-subway-garden", "Dreamlike Subway Garden", "architecture", ["subway", "garden", "surreal"], "Create a dreamlike underground subway platform converted into a night garden, tiled columns, vines through ceiling cracks, distant train glow, wet floor reflections, cinematic wide shot, and quiet surreal mood.", "16:9"],
  ["gh-ink-wash-mountain-app", "Ink Wash Mountain App", "ui", ["travel", "ink wash", "app"], "Design a travel planning app screen inspired by ink-wash mountain scrolls, layered destination cards, itinerary path, brush-texture map panel, minimal controls, and modern readable UI hierarchy.", "4:5"],
  ["gh-forgotten-astronaut-polaroids", "Forgotten Astronaut Polaroids", "poster", ["astronaut", "polaroid", "archive"], "Create a collage of fictional forgotten astronaut polaroids pinned to a corkboard, moon dust, faded color shifts, mission patch shapes without logos, handwritten marks abstracted, and archival mystery mood.", "4:5"],
  ["gh-brutalist-tea-set", "Brutalist Tea Set", "product", ["tea set", "brutalist", "ceramic"], "Create a product hero image of an unbranded brutalist ceramic tea set, angular cups, rough clay body, concrete table, hard side light, sparse composition, and tactile shadow geometry.", "4:5"],
  ["gh-childrens-dinosaur-library-map", "Children Dinosaur Library Map", "infographic", ["children", "library", "map"], "Create a playful children's library map shaped like a friendly dinosaur, book zones as body sections, reading cave, craft table, story stairs, bright icons, and simple wayfinding without real names.", "16:9"],
  ["gh-fashion-ai-stylist-dashboard", "Fashion AI Stylist Dashboard", "ui", ["fashion", "AI stylist", "dashboard"], "Design a web dashboard for a fictional AI stylist tool, outfit boards, fabric chips, season filters, client mood card, clean commerce workflow, and editorial-grade spacing.", "16:9"],
  ["gh-candlelit-watchmaker-bench", "Candlelit Watchmaker Bench", "photography", ["watchmaker", "bench", "craft"], "Create a cinematic close photo of a watchmaker bench by candlelight, brass gears, loupe, velvet tray, shallow focus, patina, blurred notes, and a precise handcraft atmosphere.", "3:2"],
  ["gh-ice-hotel-room-render", "Ice Hotel Room Render", "architecture", ["ice hotel", "interior", "blue hour"], "Render an original ice hotel room at blue hour, carved translucent walls, fur textures, hidden warm lights, frosted floor reflections, and wide interior photography composition.", "16:9"],
  ["gh-folk-horror-harvest-mask", "Folk Horror Harvest Mask", "character", ["mask", "folk horror", "costume"], "Design an original folk-horror harvest mask character study, straw fibers, carved wood face, embroidered cloak, studio turntable pose, eerie but non-gory mood, and no real ritual symbols.", "4:5"],
  ["gh-data-privacy-board-game", "Data Privacy Board Game", "product", ["board game", "privacy", "education"], "Create a product mockup for a fictional data privacy board game, modular tiles, token pieces, abstract lock icons, instruction cards with unreadable text blocks, and friendly educational design.", "4:5"],
  ["gh-wildflower-seed-envelope-system", "Wildflower Seed Envelope System", "product", ["seed", "envelope", "botanical"], "Create an unbranded wildflower seed envelope system, six packets, botanical line drawings, color-coded tabs, recycled paper fibers, garden twine, and organized ecommerce flat lay.", "4:5"],
  ["gh-train-dining-car-evening", "Train Dining Car Evening", "photography", ["train", "dining car", "evening"], "Create an atmospheric photo inside a vintage train dining car at evening, table lamps, blurred countryside through window, silverware highlights, burgundy upholstery, and cinematic travel nostalgia.", "3:2"],
  ["gh-paper-cut-cybersecurity-diagram", "Paper Cut Cybersecurity Diagram", "infographic", ["cybersecurity", "paper cut", "diagram"], "Create a paper-cut style cybersecurity diagram showing device, shield, network paths, alert zones, and safe backup flow, with layered cardstock shadows and clear modular structure.", "16:9"],
  ["gh-miniature-mars-research-base", "Miniature Mars Research Base", "product", ["mars", "miniature", "diorama"], "Create a hobby product photograph of an original miniature Mars research base diorama, tiny habitat modules, rover tracks, red dust, LED windows, scale ruler, and handcrafted realism.", "4:5"],
  ["gh-cinematic-bakery-opening-shot", "Cinematic Bakery Opening Shot", "photography", ["bakery", "cinematic", "morning"], "Create a cinematic morning photo of a small bakery opening, flour in air, tray of pastries, worker silhouette, blue dawn outside, warm oven glow, and natural documentary imperfection.", "3:2"],
  ["gh-urban-beekeeping-manual", "Urban Beekeeping Manual", "infographic", ["beekeeping", "urban", "manual"], "Create a visual manual page for urban beekeeping basics, rooftop hive, protective gear icons, seasonal cycle, honey frame diagram, safety notes as short blocks, and calm yellow-black hierarchy.", "4:5"],
  ["gh-synthwave-climbing-gym-poster", "Synthwave Climbing Gym Poster", "poster", ["climbing", "synthwave", "sport"], "Design a synthwave poster visual for a fictional indoor climbing night, neon holds, diagonal wall geometry, silhouetted climber, magenta-orange gradient, blank event title area, and grainy print texture.", "4:5"],
  ["gh-analog-camera-exploded-view", "Analog Camera Exploded View", "infographic", ["camera", "exploded view", "analog"], "Create an exploded-view diagram of an unbranded analog camera, lens groups, shutter, film path, body shell, screws, and clean engineering callout zones with no brand marks.", "16:9"],
  ["gh-botanical-restaurant-menu-board", "Botanical Restaurant Menu Board", "typography", ["menu", "botanical", "restaurant"], "Create a botanical restaurant menu board visual with painted herb borders, abstract menu line blocks, chalk texture, warm bistro lighting, elegant spacing, and no readable real dish names.", "4:5"],
  ["gh-mobile-rpg-inventory-ui", "Mobile RPG Inventory UI", "ui", ["RPG", "inventory", "mobile UI"], "Design a mobile RPG inventory screen with item grid, potion details, equipment tabs, readable fantasy icons, warm parchment UI, thumb-friendly controls, and no existing game style.", "4:5"],
  ["gh-silent-film-robot-poster", "Silent Film Robot Poster", "poster", ["silent film", "robot", "vintage"], "Create a silent-film-era poster visual for an original robot character, sepia ink, theatrical spotlight, ornamental frame, scratched film texture, blank title panel, and no readable fake text.", "4:5"],
  ["gh-neon-fish-market-night", "Neon Fish Market Night", "photography", ["fish market", "neon", "night"], "Create a realistic night fish market photo, neon reflections on wet floor, crushed ice, seafood shapes, workers as motion silhouettes, humid air, documentary lens feel, and no readable signage.", "3:2"],
  ["gh-eco-hotel-booking-flow", "Eco Hotel Booking Flow", "ui", ["hotel", "booking", "eco"], "Design a web booking flow for a fictional eco hotel, room comparison cards, impact filter chips, calendar drawer, clear total price area, and warm nature-inspired UI system.", "16:9"],
  ["gh-library-of-things-campaign", "Library Of Things Campaign", "poster", ["library", "campaign", "objects"], "Create a public campaign poster for a fictional library of things, oversized tool, camera, tent and mixer silhouettes, community color palette, grid layout, and blank copy-safe blocks.", "4:5"],
  ["gh-microbrewery-floor-plan", "Microbrewery Floor Plan", "infographic", ["brewery", "floor plan", "process"], "Create a top-down microbrewery floor plan infographic, mash tun, fermentation tanks, taproom, storage, visitor route, process arrows, warm industrial palette, and no real brand names.", "16:9"],
  ["gh-vaporwave-dental-app", "Vaporwave Dental App", "ui", ["dental", "vaporwave", "mobile UI"], "Design a playful dental appointment app screen with vaporwave accents, appointment timeline, tooth care card, dentist profile placeholder, rounded controls, and credible healthcare hierarchy.", "4:5"],
  ["gh-ancient-observatory-cutaway", "Ancient Observatory Cutaway", "infographic", ["observatory", "ancient", "cutaway"], "Create a cutaway diagram of a fictional ancient observatory, stair passages, star chamber, water clock, sight lines, stone texture, and educational labels arranged in clean zones.", "16:9"],
  ["gh-corduroy-backpack-catalog", "Corduroy Backpack Catalog", "product", ["backpack", "corduroy", "catalog"], "Create a catalog product shot of an unbranded corduroy backpack, moss green fabric ribs, brass zippers, notebook and thermos props, overhead three-quarter angle, and soft autumn light.", "4:5"],
  ["gh-ink-dragon-weather-map", "Ink Dragon Weather Map", "experimental", ["weather map", "dragon", "ink"], "Create an expressive weather map where cloud fronts form an abstract ink dragon over a fictional coastline, pressure lines, storm symbols, rice paper texture, and balanced scientific-fantasy composition.", "16:9"],
  ["gh-coral-jewelry-lookbook", "Coral Jewelry Lookbook", "product", ["jewelry", "coral", "lookbook"], "Create a jewelry lookbook board for unbranded coral-inspired pieces, macro detail inserts, shell shadows, pale sand background, soft editorial grid, and no logos or readable labels.", "4:5"],
  ["gh-mechanical-bird-automata", "Mechanical Bird Automata", "character", ["automata", "bird", "steampunk"], "Design an original mechanical bird automata character, brass feathers, exposed tiny gears, wind-up key, three pose studies, museum display lighting, and delicate non-franchise silhouette.", "4:5"],
  ["gh-remote-work-cabin-dashboard", "Remote Work Cabin Dashboard", "ui", ["remote work", "cabin", "dashboard"], "Design a productivity dashboard for remote workers in cabins, offline status, task focus timer, weather-aware planning, bandwidth card, warm wood palette, and calm minimal hierarchy.", "16:9"],
  ["gh-cosmic-grocery-label-system", "Cosmic Grocery Label System", "typography", ["grocery", "label", "cosmic"], "Create a fictional cosmic grocery label system, fruit crates with planet motifs, bold type-like abstract shapes, sticker rolls, price tags without readable numbers, and playful print texture.", "4:5"],
  ["gh-theater-lighting-control-ui", "Theater Lighting Control UI", "ui", ["theater", "lighting", "control"], "Design a tablet UI for theater lighting control, scene presets, color wheel, cue timeline, fixture groups, dark backstage theme, and practical controls that look usable.", "4:5"],
  ["gh-mountain-rescue-kit-diagram", "Mountain Rescue Kit Diagram", "infographic", ["rescue", "mountain", "kit"], "Create a mountain rescue kit diagram with rope, beacon, thermal blanket, first aid modules, radio, numbered blank callouts, and rugged safety-manual visual language.", "4:5"],
  ["gh-bauhaus-cat-cafe-brand-board", "Bauhaus Cat Cafe Brand Board", "poster", ["bauhaus", "cat cafe", "brand board"], "Create a Bauhaus-inspired brand board for a fictional cat cafe, geometric cat forms, primary color palette, poster fragments, packaging mockups without text, and tidy design-system layout.", "16:9"],
  ["gh-rainforest-canopy-research-station", "Rainforest Canopy Research Station", "architecture", ["rainforest", "research", "canopy"], "Render a rainforest canopy research station suspended among giant trees, rope bridges, solar panels, mist, botanist silhouettes, wet leaves, and cinematic environmental storytelling.", "16:9"],
  ["gh-lunar-noodle-bar-menu-ui", "Lunar Noodle Bar Menu UI", "ui", ["menu", "space", "restaurant UI"], "Design a self-order kiosk UI for a fictional lunar noodle bar, bowl customization cards, oxygen-safe spice scale, queue number panel, space diner palette, and clear purchase hierarchy.", "4:5"],
  ["gh-rug-tufting-workshop-photo", "Rug Tufting Workshop Photo", "photography", ["rug tufting", "workshop", "craft"], "Create a documentary photo of a rug tufting workshop, colorful yarn walls, tufting frame, hands in motion, soft studio clutter, natural overhead light, and tactile craft realism.", "3:2"],
  ["gh-stained-glass-saas-hero", "Stained Glass SaaS Hero", "ui", ["SaaS", "stained glass", "landing"], "Design a SaaS landing hero where the dashboard preview is framed by stained-glass-inspired data panels, refined jewel colors, headline-safe zone, CTA strip, and modern product credibility.", "16:9"],
  ["gh-hyperreal-moss-terrarium", "Hyperreal Moss Terrarium", "product", ["terrarium", "moss", "macro"], "Create a hyperreal product photo of an unbranded moss terrarium, condensation beads, tiny stone path, curved glass distortion, black background, and macro luxury object composition.", "4:5"],
  ["gh-accordion-repair-poster", "Accordion Repair Poster", "poster", ["accordion", "repair", "vintage"], "Create a vintage poster visual for a fictional accordion repair shop, bellows geometry, hand tool silhouettes, warm cream and red palette, aged ink texture, and blank typography panels.", "4:5"],
  ["gh-micro-apartment-exploded-plan", "Micro Apartment Exploded Plan", "infographic", ["micro apartment", "exploded plan", "interior"], "Create an exploded axonometric plan of a fictional micro apartment, fold-down bed, sliding kitchen, storage walls, bathroom pod, airflow arrows, and clear modular annotations.", "16:9"],
  ["gh-crystal-radio-kit-packaging", "Crystal Radio Kit Packaging", "product", ["radio kit", "packaging", "retro"], "Create packaging for an unbranded crystal radio kit, open box, coil wire, earphone, illustrated manual with abstract marks, retro science palette, and tidy tabletop presentation.", "4:5"],
  ["gh-seed-bank-control-room", "Seed Bank Control Room", "architecture", ["seed bank", "control room", "science"], "Render a secure seed bank control room, frost-proof vault door, sample drawers, soft blue monitoring screens, technician silhouettes, botanical diagrams as abstract panels, and documentary realism.", "16:9"],
  ["gh-pixel-art-harbor-sticker-sheet", "Pixel Art Harbor Sticker Sheet", "character", ["pixel art", "harbor", "sticker"], "Create a pixel-art-inspired sticker sheet of harbor objects, tugboat, gull, buoy, crate, lighthouse, raincoat mascot, consistent grid scale, crisp silhouettes, and no existing game references.", "1:1"],
  ["gh-mooncake-packaging-editorial", "Mooncake Packaging Editorial", "product", ["mooncake", "packaging", "editorial"], "Create an editorial product image of unbranded mooncake packaging, embossed blank box, sliced pastry, tea steam, dark lacquer table, warm festival lighting, and refined negative space.", "4:5"],
  ["gh-forest-fire-evacuation-map", "Forest Fire Evacuation Map", "infographic", ["evacuation", "forest fire", "map"], "Create a fictional forest fire evacuation map with safe routes, lookout points, shelter icons, wind arrows, terrain shading, and calm emergency-design hierarchy without real locations.", "16:9"],
  ["gh-avant-garde-hair-salon-board", "Avant Garde Hair Salon Board", "poster", ["hair salon", "avant garde", "moodboard"], "Create an avant-garde hair salon visual board, sculptural hair silhouettes, material swatches, mirror fragments, monochrome plus acid green palette, blank appointment card, and editorial layout.", "4:5"],
  ["gh-robot-farmers-market-mascot", "Robot Farmers Market Mascot", "character", ["robot", "farmers market", "mascot"], "Design an original robot farmers market mascot, basket torso, vegetable antenna, four expression poses, rounded friendly silhouette, enamel pin style, and no existing character resemblance.", "1:1"],
  ["gh-marine-rescue-app-ui", "Marine Rescue App UI", "ui", ["marine rescue", "mobile UI", "safety"], "Design a mobile marine rescue app screen, distress button, tide chart, vessel location card, emergency checklist, dark ocean palette, and clear safety-first hierarchy.", "4:5"],
  ["gh-futurist-library-reading-room", "Futurist Library Reading Room", "architecture", ["library", "futurist", "interior"], "Render a futurist public library reading room, suspended study pods, paper books mixed with ambient displays, acoustic felt surfaces, skylight beams, and calm civic architecture.", "16:9"],
  ["gh-circuit-board-city-poster", "Circuit Board City Poster", "poster", ["circuit board", "city", "poster"], "Create a poster visual where a fictional city map resembles a circuit board, copper traces as streets, glowing nodes, dark teal substrate, and blank title-safe margin.", "4:5"],
  ["gh-spice-market-sound-map", "Spice Market Sound Map", "experimental", ["sound map", "spice market", "sensory"], "Create a sensory map of a fictional spice market where sound waves, aroma trails, and stall shapes overlap, warm pigments, hand-drawn arrows, and layered editorial infographic energy.", "16:9"],
  ["gh-ceramic-robot-planter", "Ceramic Robot Planter", "product", ["robot", "planter", "ceramic"], "Create a product image of an unbranded ceramic robot planter with succulent hair, tiny drainage feet, matte glaze, soft shadow, playful shelf context, and ecommerce-ready crop.", "4:5"],
  ["gh-floating-bookstore-canal", "Floating Bookstore Canal", "photography", ["bookstore", "canal", "documentary"], "Create a documentary photo of a floating bookstore on a narrow canal, stacked books as unreadable color blocks, cloudy morning, bicycle on bridge, water reflections, and gentle realism.", "3:2"],
  ["gh-collage-healthcare-dashboard", "Collage Healthcare Dashboard", "ui", ["healthcare", "collage", "dashboard"], "Design a healthcare dashboard concept using tasteful paper-collage visuals, appointment cards, medication reminders, privacy-safe charts, calm colors, and accessible spacing.", "16:9"],
  ["gh-ancient-bakery-cutaway", "Ancient Bakery Cutaway", "infographic", ["bakery", "ancient", "cutaway"], "Create a cutaway illustration of a fictional ancient bakery, grain storage, stone oven, kneading table, water source, street counter, and educational callout composition.", "16:9"],
  ["gh-felt-forest-alphabet", "Felt Forest Alphabet", "typography", ["alphabet", "felt", "forest"], "Create an alphabet artwork where large letters are made from felt forest objects, mushrooms, moss, pine needles, acorns, soft studio shadows, and readable handcrafted forms.", "4:5"],
  ["gh-night-bus-poetry-zine", "Night Bus Poetry Zine", "poster", ["zine", "night bus", "poetry"], "Create a poetry zine cover visual about a night bus ride, grainy photocopy texture, window reflections, ticket fragments, deep blue and sodium orange palette, and blank title space.", "4:5"],
  ["gh-watercolor-camping-checklist", "Watercolor Camping Checklist", "infographic", ["camping", "checklist", "watercolor"], "Create a watercolor camping checklist visual, tent, stove, rainfly, water filter, layered backpack modules, check boxes as simple icons, and airy outdoor guide layout.", "4:5"],
  ["gh-fashion-archive-database-ui", "Fashion Archive Database UI", "ui", ["fashion archive", "database", "web UI"], "Design a web UI for a fashion archive database, garment cards, fabric taxonomy, timeline filter, accession details, neutral museum palette, and editorial information density.", "16:9"],
  ["gh-lighthouse-weather-station", "Lighthouse Weather Station", "architecture", ["lighthouse", "weather station", "coastal"], "Render a modern lighthouse weather station on a rocky coast, antenna arrays, solar panels, storm clouds, crashing waves, warm interior light, and cinematic maritime realism.", "16:9"],
  ["gh-sourdough-microbiology-poster", "Sourdough Microbiology Poster", "infographic", ["sourdough", "microbiology", "poster"], "Create an educational sourdough microbiology poster, starter jar, yeast and bacteria icons, fermentation bubbles, timeline bands, warm bakery palette, and clear simplified science labels.", "4:5"],
  ["gh-mystic-map-stationery-suite", "Mystic Map Stationery Suite", "product", ["stationery", "map", "mystic"], "Create an unbranded stationery suite with mystic map motifs, folded note cards, wax seal, envelope liners, compass symbols as abstract shapes, parchment texture, and premium flat lay.", "4:5"],
  ["gh-kinetic-sculpture-gallery", "Kinetic Sculpture Gallery", "photography", ["kinetic sculpture", "gallery", "art"], "Create a gallery photograph of a fictional kinetic sculpture installation, suspended metal rings, motion blur, white walls, visitors as tiny silhouettes, and high-end art documentation.", "3:2"],
  ["gh-mushroom-coffee-product", "Mushroom Coffee Product", "product", ["mushroom coffee", "packaging", "wellness"], "Create an unbranded mushroom coffee product scene, matte pouch, ceramic scoop, dried mushroom forms, forest floor color palette, soft misty light, and clean ecommerce composition.", "4:5"],
  ["gh-tactile-language-learning-app", "Tactile Language Learning App", "ui", ["language learning", "tactile", "mobile UI"], "Design a language learning app screen with tactile flashcards, pronunciation waveform, cultural note tile, streak badge, paper-and-clay visual style, and clear learning flow.", "4:5"],
  ["gh-gothic-greenhouse-wedding", "Gothic Greenhouse Wedding", "poster", ["wedding", "greenhouse", "gothic"], "Create a gothic greenhouse wedding poster visual, black botanicals, glasshouse arches, candle reflections, cream typography-safe blocks, moody romantic palette, and no readable names.", "4:5"],
  ["gh-smart-bike-lock-diagram", "Smart Bike Lock Diagram", "infographic", ["bike lock", "smart device", "diagram"], "Create an exploded technical diagram of an unbranded smart bike lock, shackle, battery, sensor, phone signal, security layers, and clean product-engineering layout.", "16:9"],
  ["gh-castle-cloud-server-room", "Castle Cloud Server Room", "architecture", ["server room", "castle", "surreal"], "Render a surreal cloud server room inside a medieval castle tower, server racks, stone arches, fiber cables like banners, misty windows, and cinematic blue-orange lighting.", "16:9"],
  ["gh-tiny-planet-bakery-logo-board", "Tiny Planet Bakery Logo Board", "typography", ["bakery", "logo board", "tiny planet"], "Create a brand exploration board for a fictional tiny planet bakery, circular bread planets, logo-like abstract marks, pastry icons, color swatches, and blank name blocks.", "16:9"],
  ["gh-expedition-first-aid-ui", "Expedition First Aid UI", "ui", ["first aid", "expedition", "mobile UI"], "Design an offline expedition first aid app screen, injury cards, step checklist, emergency contact, map coordinate strip, red safety accents, and highly readable field interface.", "4:5"],
  ["gh-urban-night-orchid-photo", "Urban Night Orchid Photo", "photography", ["orchid", "urban", "night"], "Create a nighttime urban botanical photograph of orchids in a small apartment window, neon street reflections, water droplets, shallow focus, quiet solitude, and natural imperfect realism.", "3:2"],
  ["gh-embroidered-space-patch-set", "Embroidered Space Patch Set", "product", ["patch", "space", "embroidery"], "Create a product shot of embroidered fictional space mission patches, thread texture, merrowed edges, varied abstract planet symbols, dark fabric background, and no real agency logos.", "4:5"],
  ["gh-circular-economy-kitchen-map", "Circular Economy Kitchen Map", "infographic", ["circular economy", "kitchen", "map"], "Create an illustrated circular economy map for a home kitchen, compost, leftovers, refill station, repair shelf, energy flow arrows, friendly icons, and clear loop structure.", "16:9"],
  ["gh-clay-tablet-finance-dashboard", "Clay Tablet Finance Dashboard", "ui", ["finance", "clay tablet", "dashboard"], "Design a finance dashboard as if carved into modern clay tablets, raised chart blocks, tactile shadows, clean numeric placeholders, warm neutral palette, and usable layout logic.", "16:9"],
  ["gh-mirror-maze-fashion-editorial", "Mirror Maze Fashion Editorial", "editorial", ["fashion", "mirror maze", "editorial"], "Create a fashion editorial image in a mirror maze, original model silhouette, fractured reflections, silver fabric, flash highlights, controlled visual confusion, and no celebrity resemblance.", "4:5"],
  ["gh-japanese-joinery-catalog", "Japanese Joinery Catalog", "infographic", ["joinery", "woodwork", "catalog"], "Create a respectful fictional wood joinery catalog page, exploded timber joints, grain detail, tool silhouettes, numbered blank callouts, calm workshop palette, and precise diagram spacing.", "4:5"],
  ["gh-monochrome-desert-fashion-lookbook", "Monochrome Desert Fashion Lookbook", "editorial", ["fashion", "desert", "lookbook"], "Create a monochrome desert fashion lookbook board with four poses of an original model, wind-shaped fabric, harsh sun shadows, consistent styling, and magazine contact-sheet composition.", "4:5"],
  ["gh-astral-clockwork-calendar", "Astral Clockwork Calendar", "experimental", ["calendar", "clockwork", "astral"], "Create an astral clockwork calendar illustration, rotating brass rings, moon phases, zodiac-like abstract symbols, deep navy background, precise radial symmetry, and no readable text.", "1:1"]
];

const targetItems = items.slice(0, 100);

if (targetItems.length !== 100) {
  throw new Error(`Expected 100 items, got ${targetItems.length}`);
}

function toQueueItem(raw, index) {
  const [id, title, category, tags, prompt, aspectRatio] = raw;
  const source = sourceNotes[index % sourceNotes.length];
  return {
    id,
    title,
    category,
    tags,
    prompt,
    sourceLabel: "GitHub-inspired remix",
    sourceUrl: source.url,
    sourceNote: source.label,
    negativePrompt: negativeByCategory[category] || "no logos, no watermark, no clutter",
    aspectRatio,
    seoIntent: `${title.toLowerCase()} AI image prompt`,
    generation: { candidateCount: 1 },
    status: "needs_generation",
    priority: index + 1,
    queue: batchName
  };
}

fs.mkdirSync(outDir, { recursive: true });

const queue = targetItems.map(toQueueItem);
const jsonPath = path.join(outDir, `${batchName}.json`);
const jsonlPath = path.join(outDir, `${batchName}.jsonl`);

const jobs = queue.map((item) =>
  JSON.stringify({
    model: "gpt-image-2",
    prompt: [
      item.prompt,
      `Use a visual language sampled from ${item.sourceNote}, but rewrite the scene as an original PromptArc image.`,
      `Final format: ${item.aspectRatio} composition, strong thumbnail readability, distinct from existing PromptArc gallery items.`,
      `Negative prompt: ${item.negativePrompt}.`
    ].join(" "),
    size: sizeByRatio[item.aspectRatio] || "1024x1536",
    quality: "low",
    output_format: "png",
    out: `${item.id}.png`
  })
);

fs.writeFileSync(jsonPath, JSON.stringify(queue, null, 2) + "\n", "utf8");
fs.writeFileSync(jsonlPath, jobs.join("\n") + "\n", "utf8");

console.log(`Wrote ${queue.length} GitHub-inspired prompt items.`);
console.log(jsonPath);
console.log(jsonlPath);
