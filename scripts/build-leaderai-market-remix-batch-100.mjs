import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "content-pipeline");
const batchName = "leaderai-market-remix-batch-100";

const sourceUrl = "https://www.leaderai.top/mid-api/lab/image_prompt/index.html";
const categorySignalUrl = "https://cdn.leaderai.top/oss/moban-image/image_prompt/imgs_category.json";

const sizeByRatio = {
  "1:1": "1024x1024",
  "4:5": "1024x1536",
  "16:9": "1536x1024",
  "3:2": "1536x1024",
  "9:16": "1024x1536"
};

const negativeByCategory = {
  portrait: "no celebrity resemblance, no copied influencer identity, no logos, no watermark, no plastic skin, no extra fingers",
  typography: "no real brand names, no tiny unreadable text, no copyrighted layout, no watermark, no dense clutter",
  experimental: "no copied artwork, no readable fake brand text, no watermark, no chaotic composition, no gore",
  character: "no existing IP, no Funko Pop trademark style, no copyrighted character, no logo, no extra limbs",
  product: "no real brand logo, no trademark packaging, no warped product, no watermark, no unreadable label clutter",
  poster: "no real event names, no copied magazine cover, no watermark, no celebrity likeness, no readable fake text",
  architecture: "no famous landmark copy, no real address, no logo, no distorted perspective, no oversmoothed render",
  ui: "no real app logos, no private data, no unreadable microcopy, no impossible controls, no trademarked UI"
};

const items = [
  ["lm-portrait-rain-window-tea", "Rain Window Tea Portrait", "portrait", ["portrait", "warm light", "cinematic"], "Create an original cinematic portrait of a young adult sitting by a rain-streaked window with a ceramic tea cup, pine forest blur outside, warm lamp reflection on glass, natural skin texture, quiet introspective mood, 85mm lens feel, commercial editorial polish.", "4:5"],
  ["lm-portrait-neon-alley-runner", "Neon Alley Runner Portrait", "portrait", ["street", "neon", "athletic"], "Create a hyperreal street portrait of an original night runner in a wet neon alley, reflective windbreaker, vapor in cold air, cyan and amber rim light, dynamic shoulder crop, gritty urban fashion energy, no brand marks.", "4:5"],
  ["lm-portrait-black-turtleneck-film", "Black Turtleneck Film Portrait", "portrait", ["black and white", "film", "minimal"], "Create a black-and-white film portrait of an original person in a high black turtleneck, hair partly crossing the face, hard side light, clean concrete background, visible film grain, restrained magazine-cover sophistication.", "4:5"],
  ["lm-portrait-cat-balanced-head", "Warm Cat Companion Portrait", "portrait", ["cat", "warm", "lifestyle"], "Create a warm lifestyle portrait of an original man seated on a sofa while a large fluffy cat balances playfully on his head, sunlit apartment, cozy humor, realistic fur detail, candid documentary framing, no meme text.", "4:5"],
  ["lm-portrait-apocalypse-street", "Apocalypse Street Portrait", "portrait", ["apocalypse", "street", "surreal"], "Create a cinematic portrait of an original youth standing in a damaged city street after a surreal storm, ash in the air, orange horizon glow, cracked asphalt, high-contrast rim light, fashion editorial pose, non-violent atmosphere.", "4:5"],
  ["lm-portrait-kpop-light-study", "K Pop Light Study Portrait", "portrait", ["fashion", "beauty", "light study"], "Create a polished fashion-beauty portrait of an original performer under prismatic studio lights, glossy black outfit, sharp cheek highlights, soft lavender background, confident gaze, clean commercial lighting study.", "4:5"],
  ["lm-portrait-snow-carousel-couple", "Snow Carousel Couple Portrait", "portrait", ["couple", "snow", "romance"], "Create a romantic cinematic portrait of an original couple riding a vintage carousel during light snow, warm bulbs, motion blur, soft eye contact, wool coats, dreamy winter commercial look without real location markers.", "4:5"],
  ["lm-portrait-faceless-lazy-selfie", "Faceless Lazy Selfie", "portrait", ["selfie", "faceless", "casual"], "Create a faceless lifestyle selfie composition from chest-down view, oversized sweater, messy bed, afternoon sun patches, coffee mug, phone edge visible, intimate casual atmosphere, realistic everyday texture.", "4:5"],
  ["lm-portrait-paris-night-no-landmark", "Parisian Night Mood Portrait", "portrait", ["night", "fashion", "city"], "Create a glamorous city-night portrait of an original woman in a long coat on a rainy boulevard, warm cafe lights, blurred ironwork shapes in distance without recognizable landmark, red lipstick, cinematic bokeh.", "4:5"],
  ["lm-portrait-green-eye-macro", "Green Eye Macro Portrait", "portrait", ["macro", "eyes", "beauty"], "Create a beauty macro portrait centered on vivid green eyes, wet hair strands, skin pores, soft shadow, muted emerald background, realistic studio retouch level, no identity resemblance.", "4:5"],
  ["lm-portrait-rooftop-designer", "Rooftop Designer Portrait", "portrait", ["designer", "rooftop", "editorial"], "Create a commercial portrait of an original creative director on a rooftop at golden hour, black blazer, sketchbook, city haze, confident posture, editorial realism, subtle lens flare.", "4:5"],
  ["lm-portrait-biker-night-market", "Night Market Biker Portrait", "portrait", ["biker", "night market", "documentary"], "Create a documentary-style portrait of an original scooter rider at a night market, helmet under arm, steam from food stalls, neon reflections, candid street-photo authenticity.", "3:2"],
  ["lm-portrait-ski-lodge-firelight", "Ski Lodge Firelight Portrait", "portrait", ["ski lodge", "winter", "warm"], "Create an original winter portrait near a ski lodge fireplace, wool layers, snow outside window, orange firelight, relaxed commercial travel mood, shallow depth of field.", "4:5"],
  ["lm-portrait-vintage-train-reader", "Vintage Train Reader Portrait", "portrait", ["train", "reading", "nostalgia"], "Create a portrait of an original traveler reading beside a vintage train window, passing landscape blur, brass lamp, tweed coat, soft nostalgic color grade.", "4:5"],
  ["lm-portrait-ceramic-artist-hands", "Ceramic Artist Hands Portrait", "portrait", ["artist", "ceramic", "craft"], "Create a craft portrait focusing on an original ceramic artist's face and clay-covered hands, studio shelves, natural north light, tactile realism, calm concentration.", "4:5"],
  ["lm-portrait-coastal-windcoat", "Coastal Windcoat Portrait", "portrait", ["coast", "wind", "fashion"], "Create a windswept coastal fashion portrait of an original person in a long waterproof coat, grey sea, strong side wind, salt spray, premium outdoor editorial feel.", "4:5"],
  ["lm-portrait-subway-blue-hour", "Subway Blue Hour Portrait", "portrait", ["subway", "blue hour", "urban"], "Create an urban portrait of an original commuter on a quiet subway platform at blue hour, fluorescent lights, tiled walls, long shadows, cinematic solitude.", "4:5"],
  ["lm-portrait-desert-silk-shadow", "Desert Silk Shadow Portrait", "portrait", ["desert", "fashion", "monochrome"], "Create a monochrome desert fashion portrait of an original model wearing flowing silk, hard sun, long dune shadows, minimalist luxury campaign mood.", "4:5"],
  ["lm-portrait-flower-shop-owner", "Flower Shop Owner Portrait", "portrait", ["flower shop", "owner", "warm"], "Create a warm portrait of an original flower shop owner behind buckets of seasonal stems, morning storefront light, apron texture, realistic smile, local-business commercial tone.", "4:5"],
  ["lm-portrait-cyber-studio-musician", "Cyber Studio Musician Portrait", "portrait", ["musician", "studio", "cyber"], "Create a portrait of an original electronic musician in a dark studio, modular synth lights, translucent headphones, violet rim light, focused creative energy.", "4:5"],

  ["lm-layout-ai-horizon-chart", "AI Horizon Art Chart", "typography", ["chart", "AI", "editorial"], "Design an editorial chart visual about fictional AI task horizons, hand-drawn red timeline marks, rough black annotations kept abstract, painterly beige paper background, energetic magazine information design, no real data claims.", "16:9"],
  ["lm-layout-korean-finance-frontpage", "Korean Finance Frontpage Layout", "typography", ["newspaper", "finance", "layout"], "Create a fictional Korean-style financial newspaper front page layout, dense column grid, stock-chart blocks, bold masthead shapes without readable real text, cream paper, red and black hierarchy.", "4:5"],
  ["lm-layout-travel-magazine-kanazawa", "Craft City Travel Magazine Cover", "typography", ["travel", "magazine", "cover"], "Create a travel magazine cover for a fictional craft city, gold leaf texture, rain street photo inset, elegant vertical title-like abstract marks, editorial grid, premium print finish.", "4:5"],
  ["lm-layout-vacuum-ranking-page", "Vacuum Ranking Editorial Page", "typography", ["review", "ranking", "editorial"], "Design a consumer review editorial spread for five fictional compact vacuums, product silhouettes, comparison bars, numbered cards, clean affiliate-style layout, no real brands.", "16:9"],
  ["lm-layout-primordial-black-hole-poster", "Primordial Black Hole Science Poster", "typography", ["science", "poster", "space"], "Create a science poster explaining fictional primordial black hole survival, dark cosmic background, diagram rings, short abstract text blocks, orange highlights, museum education design.", "4:5"],
  ["lm-layout-design-ten-commandments", "Product Design Ten Principles Poster", "typography", ["design", "poster", "minimal"], "Design a minimalist product-design principles poster, ten modular panels, grayscale product silhouettes, numbered circles, Swiss grid, restrained red accent, no copied Dieter Rams wording.", "4:5"],
  ["lm-layout-fantasy-adventure-poster", "Fantasy Adventure Comedy Poster", "poster", ["fantasy", "adventure", "movie poster"], "Create a fantasy adventure comedy poster for an original treasure hunt, mismatched explorers, dragon-shaped cave, bright cinematic lighting, blank title panel, energetic theatrical composition.", "4:5"],
  ["lm-layout-personal-ai-assistant", "Personal AI Assistant Interface", "ui", ["AI assistant", "productivity", "interface"], "Design a polished interface concept for a personal AI productivity assistant, timeline, task cards, context memory chips, calm gradient, clear SaaS hierarchy, no real logos.", "16:9"],
  ["lm-layout-retro-secret-robot-poster", "Retro Secret Robot Poster", "poster", ["retro", "classified", "robot"], "Create a retro classified-file poster for an original giant robot, stamped folder shapes, halftone texture, warning stripes, dramatic silhouette, no existing anime references.", "4:5"],
  ["lm-layout-magazine-cover-generator", "Magazine Cover Generator Demo", "typography", ["magazine", "cover", "template"], "Create a demo image showing four fictional magazine cover variations, fashion, food, tech, travel, arranged as a clean grid with placeholder mastheads and strong visual variety.", "16:9"],
  ["lm-layout-edge-browser-migration", "Browser Migration Explainer", "infographic", ["browser", "data", "explainer"], "Create an explainer infographic about moving bookmarks between fictional browsers, arrows, tab cards, privacy lock icons, friendly tech palette, no real browser logos.", "16:9"],
  ["lm-layout-food-layer-pizza", "Layered Pizza Construction Infographic", "infographic", ["pizza", "food", "layers"], "Create an exploded layered pizza infographic, crust, sauce, cheese, toppings hovering in clean levels, warm appetite lighting, simple callout blocks, no real restaurant branding.", "4:5"],
  ["lm-layout-social-video-template", "Social Video Interface Template", "ui", ["social media", "video", "template"], "Design a fictional short-video app screen template, creator card, comment bubbles, product pin, live counter placeholders, glossy UI, no real platform marks.", "4:5"],
  ["lm-layout-hand-drawn-calendar", "Hand Drawn Calendar Spread", "typography", ["calendar", "hand drawn", "planner"], "Create a hand-drawn monthly calendar spread with doodle icons, marker texture, habit trackers, sticky notes, colorful but tidy bullet journal style.", "4:5"],
  ["lm-layout-cyber-profile-card", "Cyber Social Profile Card", "ui", ["profile", "cyberpunk", "card"], "Design a cyberpunk personal profile card UI, holographic avatar placeholder, stat chips, neon border, dark glass panels, social links as abstract icons.", "4:5"],

  ["lm-composite-delete-monday-key", "Delete Monday Key Composite", "experimental", ["surreal", "keyboard", "humor"], "Create a surreal studio composite of a giant keyboard key labeled only with an abstract minus symbol crushing a calendar page, dramatic shadows, playful anti-Monday mood, no readable real text.", "4:5"],
  ["lm-composite-glass-bacon-grill", "Glass Bacon Grill Composite", "experimental", ["food", "glass", "surreal"], "Create an ultra-real surreal image of transparent glass bacon strips sizzling on a grill, glowing edges, smoke, reflections, absurd but appetizing commercial product-art lighting.", "4:5"],
  ["lm-composite-mini-workers-product", "Mini Workers Build Product", "experimental", ["miniature", "product", "advertising"], "Create a commercial surreal scene where tiny construction workers assemble a giant unbranded skincare jar like a skyscraper, scaffolds, studio backdrop, crisp macro detail.", "4:5"],
  ["lm-composite-giant-office-floating", "Floating Creative Workspace", "experimental", ["office", "floating", "cinematic"], "Create a cinematic surreal office floating above a quiet city, desks suspended by cables, papers drifting, warm sunset light, premium concept-ad feel, no logos.", "16:9"],
  ["lm-composite-tech-banana-device", "Tech Banana Device Ad", "experimental", ["banana", "technology", "product"], "Create a futuristic banana-shaped technology device advertisement, metallic peel panels, glowing ports, clean studio plinth, absurd innovation mood, blank brand space.", "4:5"],
  ["lm-composite-chocolate-advent-calendar", "Chocolate Banana Advent Calendar", "product", ["chocolate", "calendar", "packaging"], "Create an unbranded chocolate-banana advent calendar product image, numbered doors as abstract shapes, festive shadows, foil highlights, cozy holiday commercial look.", "4:5"],
  ["lm-composite-moon-fashion-plain", "Moon Plain Fashion Scene", "experimental", ["moon", "fashion", "cinematic"], "Create a surreal fashion editorial on a moon-like plain, reflective visor prop, flowing silver coat, blue earth glow, low-angle cinematic composition, no real space logos.", "16:9"],
  ["lm-composite-oversized-prop-studio", "Oversized Prop Studio Shoot", "experimental", ["studio", "oversized prop", "advertising"], "Create a studio photograph of an original model interacting with a giant pencil and huge paper clips, clean white cyclorama, playful scale illusion, commercial campaign polish.", "4:5"],
  ["lm-composite-ski-air-leap", "Extreme Ski Air Leap", "experimental", ["ski", "action", "sports"], "Create an extreme sports composite of a skier launching over a glowing mountain ridge, frozen powder particles, dramatic telephoto compression, believable motion, no sponsor logos.", "16:9"],
  ["lm-composite-ar-shopping-shelf", "AR Shopping Shelf Scan", "experimental", ["AR", "shopping", "interface"], "Create a realistic supermarket shelf scene overlaid with fictional AR product cards, nutrition halos, checklist panel, phone-camera perspective, no real product packaging.", "16:9"],
  ["lm-composite-thermal-mechanical-scan", "Thermal Mechanical Scan", "experimental", ["thermal", "machine", "analysis"], "Create a technical image-analysis visual of a fictional machine with thermal overlay, cutaway contours, blue-orange heat map, engineering callouts, and no real manufacturer marks.", "16:9"],
  ["lm-composite-red-pen-critique", "Red Pen Critique Portrait", "experimental", ["critique", "red pen", "editorial"], "Create a humorous editorial portrait print covered in exaggerated red critique marks, arrows and circles as abstract strokes, fashion face underneath, magazine art direction.", "4:5"],

  ["lm-toy-transparent-skeleton-doll", "Transparent Skeleton Art Doll", "character", ["toy", "transparent", "doll"], "Design an original transparent art doll with visible stylized skeleton core, soft vinyl material, pastel joints, collector-toy product photography, no trademarked toy style.", "4:5"],
  ["lm-toy-qboy-blindbox", "Streetwear Blind Box Figure", "character", ["blind box", "streetwear", "figure"], "Create a collectible blind-box figure of an original streetwear character, oversized hoodie, tiny sneakers, box insert, glossy vinyl, three-quarter product photo, no existing IP.", "4:5"],
  ["lm-toy-miniature-japanese-street", "Miniature Japanese Street Model", "character", ["miniature", "street", "model"], "Create a handcrafted miniature street scene with tiny ramen shop, vending machine shapes without logos, lantern glow, visible model edges, macro photography realism.", "4:5"],
  ["lm-toy-micro-workers-giant-camera", "Micro Workers Giant Camera", "character", ["miniature", "camera", "workers"], "Create a miniature diorama of tiny workers repairing a giant vintage camera, ladders, tool carts, dust, macro depth of field, charming hand-built realism.", "4:5"],
  ["lm-toy-angel-cradle-ornament", "Angel Cradle Ornament", "character", ["ornament", "angel", "craft"], "Design an original handcrafted angel cradle ornament, carved wood, soft fabric wings, flower details, warm tabletop lighting, collectible craft catalog style.", "4:5"],
  ["lm-toy-math-spiral-architecture", "Math Spiral Miniature", "character", ["spiral", "math", "miniature"], "Create a miniature art object where tiny architects build an infinite spiral staircase from graph paper and brass rods, museum plinth, precise shadows.", "4:5"],
  ["lm-toy-3d-keychain-cute", "Cute 3D Keychain Set", "character", ["keychain", "cute", "3D"], "Create a set of original cute 3D keychain charms, fruit robot, cloud dog, tiny rocket, glossy enamel texture, organized product grid.", "1:1"],
  ["lm-toy-retro-person-mini-model", "Retro Person Mini Model", "character", ["mini model", "retro", "collectible"], "Create a retro-style miniature person model in a clear display box, fabric jacket, tiny accessories, warm shelf lighting, collector catalog realism.", "4:5"],
  ["lm-toy-cartoon-expression-sheet", "Cartoon Expression Toy Sheet", "character", ["expression", "toy", "cartoon"], "Design an original 3D cartoon character expression sheet, six faces, tiny hand poses, pastel background, toy prototype presentation, no franchise resemblance.", "1:1"],
  ["lm-toy-line-sticker-cat", "Cat Sticker Expression Sheet", "character", ["cat", "sticker", "expression"], "Create a cute cat sticker expression sheet, twelve poses, consistent round character design, thick outline, soft pastel palette, no platform logos.", "1:1"],

  ["lm-ad-luxury-brand-quartet", "Luxury Brand Quartet Ad", "product", ["luxury", "advertising", "fashion"], "Create a luxury fashion advertisement for a fictional accessories brand, four stylish original models in symmetrical studio poses, chrome handbag shapes without logos, cream backdrop, elegant commercial polish.", "4:5"],
  ["lm-ad-japanese-energy-drink", "Japanese Street Energy Drink Ad", "product", ["drink", "street", "advertising"], "Create a Japanese street-style advertisement for an unbranded energy drink can, vending-machine glow, motion streaks, manga-like background energy, bold color blocks, no readable brand text.", "4:5"],
  ["lm-ad-capsule-car-showcase", "Capsule Car Showcase", "product", ["car", "capsule", "concept"], "Create a concept ad for a fictional capsule city car, rounded micro vehicle inside a transparent display pod, glossy showroom floor, futuristic urban backdrop, no manufacturer logos.", "16:9"],
  ["lm-ad-striped-chicken-bucket", "Striped Fried Chicken Bucket Ad", "product", ["food", "bucket", "advertising"], "Create a commercial food image of an unbranded red-and-white striped fried chicken bucket, crispy texture, steam, overhead spotlight, simple blank label panel, appetizing shadows.", "4:5"],
  ["lm-ad-beauty-data-future", "Data Driven Beauty Future Poster", "poster", ["beauty", "data", "poster"], "Create a futuristic beauty campaign poster for a fictional skincare system, glowing skin-analysis arcs, serum bottle silhouette, soft holographic data grid, clean white-pink palette, no real claims.", "4:5"],
  ["lm-ad-sports-sneaker-tech", "Sports Sneaker Tech Ad", "product", ["sneaker", "technology", "advertising"], "Create a high-energy unbranded sports sneaker technology ad, sole cross-section glow, carbon plate shape, motion particles, black studio background, premium product clarity.", "4:5"],
  ["lm-ad-perfume-fruit-scene", "Perfume Fruit Scene", "product", ["perfume", "fruit", "commercial"], "Create a commercial product photo of an unbranded perfume bottle surrounded by sliced citrus and pear, condensation, clear glass refraction, pastel background, luxury ecommerce crop.", "4:5"],
  ["lm-ad-vanilla-coffee-packaging", "Vanilla Coffee Product Ad", "product", ["coffee", "packaging", "ad"], "Create a high-end vanilla coffee product advertisement, matte pouch without logo, vanilla pod, ceramic cup, warm steam, brown cream palette, refined commercial food styling.", "4:5"],
  ["lm-ad-prismatic-crystal-object", "Prismatic Crystal Product", "product", ["crystal", "object", "studio"], "Create a studio product photograph of a prismatic crystal object, rainbow refractions, black acrylic base, crisp caustic shadows, luxury decor catalog feel.", "4:5"],
  ["lm-ad-wooden-minimal-lifestyle", "Wooden Minimal Product Photo", "product", ["wood", "minimal", "japanese"], "Create a Japanese minimal product photo of unbranded wooden desk objects, warm grain, low morning sun, linen cloth, empty label cards, calm ecommerce composition.", "4:5"],
  ["lm-ad-cosmetic-high-end-splash", "High End Cosmetic Splash", "product", ["cosmetic", "splash", "commercial"], "Create a high-end cosmetic product shot, unbranded glass jar, water splash arc, pearl texture cream, soft blue-white studio light, clean luxury campaign style.", "4:5"],
  ["lm-ad-pizza-layer-brandless", "Brandless Pizza Layer Ad", "product", ["pizza", "food", "commercial"], "Create an appetizing brandless pizza layer advertisement with hovering cheese, sauce ribbons, herbs, crust crumb macro, dark warm background, commercial food photography.", "4:5"],
  ["lm-ad-fashion-magazine-cover", "Fashion Magazine Cover Mockup", "poster", ["fashion", "magazine", "cover"], "Create a fictional fashion magazine cover mockup, original model, oversized coat, strong masthead-like abstract blocks, barcode-like shapes, premium editorial layout, no readable real title.", "4:5"],
  ["lm-ad-workspace-cinema", "Cinematic Workspace Ad", "product", ["workspace", "office", "cinematic"], "Create a cinematic commercial scene of a floating modular workstation, lamp, notebook, tablet-like blank screen, dramatic studio haze, premium productivity product mood.", "16:9"],
  ["lm-ad-streetwear-tryon-collage", "Streetwear Try On Collage", "poster", ["streetwear", "try-on", "collage"], "Create a virtual try-on collage for fictional streetwear outfits, four original model poses, Tokyo-inspired street background without landmarks, garment cutouts, clean commerce layout.", "4:5"],

  ["lm-architecture-thunder-city-night", "Thunder City Night Architecture", "architecture", ["city", "storm", "architecture"], "Render a dramatic fictional city at night during a thunderstorm, wet glass towers, lightning behind skyline, street reflections, cinematic wide angle, no recognizable landmarks.", "16:9"],
  ["lm-architecture-broken-house-renovation", "Broken House Renovation Concept", "architecture", ["renovation", "house", "before after"], "Create an architectural renovation concept image of a damaged rural house transforming into a warm modern home, split-scene visual, timber repairs, plants, practical design storytelling.", "16:9"],
  ["lm-architecture-dark-cad-plan", "Dark CAD Floor Plan Render", "architecture", ["floor plan", "CAD", "dark"], "Create a dark presentation-style floor plan from fictional CAD lines, glowing room zones, furniture silhouettes, annotation blocks, dramatic architectural board aesthetic.", "16:9"],
  ["lm-architecture-season-winter-house", "Winter House Season Variant", "architecture", ["winter", "house", "season"], "Render a fictional modern cabin in deep winter, snow-laden roof, warm interior glow, pine forest, soft dusk sky, architecture magazine realism.", "16:9"],
  ["lm-architecture-flexible-interior", "Flexible Interior Analysis", "architecture", ["interior", "analysis", "modular"], "Create an interior flexibility analysis board, sliding walls, foldable furniture, color-coded use zones, axonometric room, clean architectural presentation.", "16:9"],
  ["lm-architecture-mountain-model-live", "Mountain House Model Making", "architecture", ["model", "mountain", "studio"], "Create a realistic scene of an architect livestreaming while building a mountain house model, desk lights, foam terrain, camera rig, cozy studio clutter.", "16:9"],
  ["lm-architecture-rainbow-canal", "Rainy Canal Rainbow Scene", "architecture", ["canal", "rainbow", "romantic"], "Create a romantic fictional canal city after rain, small boat, rainbow reflection, pastel facades, wet cobblestones, cinematic travel postcard mood.", "16:9"],

  ["lm-ui-live-commerce-template", "Live Commerce UI Template", "ui", ["live commerce", "UI", "template"], "Design a live commerce interface template, host video panel, product carousel, coupon card, chat stream, order button hierarchy, fictional platform with no real logos.", "4:5"],
  ["lm-ui-fashion-tryon-panel", "Fashion Try On Panel", "ui", ["try-on", "fashion", "UI"], "Design a virtual fashion try-on panel, outfit selector, fabric detail, pose preview, size confidence meter, clean ecommerce UI, no real brand references.", "4:5"],
  ["lm-ui-ar-supermarket-assistant", "AR Supermarket Assistant UI", "ui", ["AR", "supermarket", "assistant"], "Design a phone AR supermarket assistant interface, shelf scanning frame, ingredient warnings, shopping list overlay, privacy-safe product placeholders, practical visual hierarchy.", "4:5"],
  ["lm-ui-beautyverse-kimono-window", "Beautyverse Kimono Window", "ui", ["beauty", "virtual showroom", "fashion"], "Design a futuristic virtual showroom window for kimono-inspired outfits, avatar preview, fabric swatches, lighting controls, elegant commerce interface, no cultural caricature.", "16:9"],
  ["lm-ui-ai-cover-tool", "AI Cover Tool UI", "ui", ["AI tool", "cover", "generator"], "Design a web app interface for generating magazine cover images, prompt panel, style chips, preview grid, export button, professional creator-tool layout.", "16:9"],

  ["lm-illustration-tang-changan", "Tang Inspired Market Illustration", "poster", ["illustration", "ancient city", "market"], "Create an original ancient-Chang'an-inspired market illustration, lanterns, silk awnings, food carts, warm evening crowd, painterly storybook detail, historically inspired but fictional.", "16:9"],
  ["lm-illustration-city-travel-poster", "Cartoon City Travel Poster", "poster", ["travel", "cartoon", "poster"], "Create a cartoon travel poster for a fictional coastal city, chunky buildings, tram, seagulls, sunset palette, blank title space, cheerful tourism style.", "4:5"],
  ["lm-illustration-scottish-recipe", "Scottish Recipe Poster", "infographic", ["recipe", "poster", "food"], "Create a cozy illustrated recipe poster for a fictional oat cake, ingredient icons, rolling pin, tartan-inspired border, warm kitchen palette, readable layout without real text.", "4:5"],
  ["lm-illustration-morning-cat-dog-comic", "Morning Cat Dog Comic", "character", ["comic", "cat", "dog"], "Create a four-panel comic-style image of a cat cheerfully greeting a sleepy dog in the morning, expressive original characters, speech bubbles as blank shapes.", "4:5"],
  ["lm-illustration-nonheritage-craft-scroll", "Heritage Craft Scroll Illustration", "poster", ["craft", "scroll", "heritage"], "Create a respectful fictional heritage craft scroll illustration, artisan hands, woven patterns, ink landscape border, museum poster composition, no real protected symbols.", "4:5"],
  ["lm-illustration-newspaper-portrait", "Color Newspaper Portrait", "portrait", ["portrait", "newspaper", "color"], "Create a vibrant portrait collage of an original person with orange-red glasses against layered newspaper texture, hopeful color palette, playful handmade editorial mood.", "4:5"],

  ["lm-meme-dog-emotion-stickers", "Dog Emotion Sticker Set", "character", ["meme", "dog", "stickers"], "Create a child-friendly dog emotion sticker sheet, happy, confused, proud, sleepy, nervous, excited, consistent cute character, simple labels as abstract marks.", "1:1"],
  ["lm-meme-3d-girl-expressions", "3D Girl Expression Grid", "character", ["3D", "expression", "grid"], "Create a six-expression grid of an original 3D cartoon girl character, wink, laugh, surprised, thinking, sleepy, excited, glossy toy style, no existing IP.", "1:1"],
  ["lm-meme-orange-hoodie-chibi", "Orange Hoodie Chibi Pose", "character", ["chibi", "hoodie", "cute"], "Create a chibi character sticker of an original green-eyed kid in an orange hoodie, playful wink, tongue-out pose, thick outline, transparent-like clean background.", "1:1"],
  ["lm-meme-16-era-portraits", "Sixteen Era Portrait Grid", "poster", ["portrait grid", "history", "style"], "Create a 4x4 grid of original fictional portraits across different eras, consistent face structure avoided, varied costumes, painterly-to-photo evolution, no real historical people.", "1:1"],
  ["lm-meme-cute-cat-pack", "Cute Cat Sticker Pack", "character", ["cat", "sticker", "pack"], "Create a sticker pack of an original round cat character, twelve everyday actions, simple props, pastel background, clean printable layout.", "1:1"],

  ["lm-edit-old-photo-modern", "Old Photo Modern Reimagining", "experimental", ["old photo", "restoration", "modern"], "Create a before-and-after style visual of a fictional old family photo reimagined as a modern color portrait, split composition, respectful restoration aesthetic, no real person.", "16:9"],
  ["lm-edit-lighting-before-after", "Smart Relighting Comparison", "experimental", ["relighting", "comparison", "photo"], "Create a controlled before-after relighting comparison of an original portrait, same pose implied, left flat light, right cinematic rim light, clean educational layout.", "16:9"],
  ["lm-edit-restaurant-sign-redesign", "Restaurant Sign Redesign Board", "typography", ["restaurant", "sign", "redesign"], "Create a redesign board for a fictional Japanese restaurant sign, before-after panels, lantern mockup, wood texture, calligraphy-like abstract marks, no readable real name.", "16:9"],
  ["lm-edit-photo-expansion-demo", "Photo Expansion Demo", "experimental", ["outpainting", "demo", "photo"], "Create a visual demo of photo expansion, central portrait frame with extended environment fading outward into cafe interior, clean boundary guides, creator-tool educational look.", "16:9"],
  ["lm-edit-vtuber-avatar-board", "Vtuber Avatar Board", "character", ["vtuber", "avatar", "character"], "Create an original vtuber avatar concept board, front pose, expressions, accessory notes, soft neon palette, streamer-safe design, no copied anime character.", "4:5"],

  ["lm-scene-venice-rainbow-gondola", "Rainbow Canal Gondola Scene", "architecture", ["canal", "gondola", "rain"], "Create a romantic fictional canal scene after rain with a gondola-like boat, rainbow, wet stone, pastel sky, cinematic travel atmosphere, no real city landmarks.", "16:9"],
  ["lm-scene-forest-ar-plant-id", "Forest AR Plant ID Scene", "ui", ["forest", "AR", "plant"], "Create a forest scene through a phone camera with fictional AR plant identification overlays, leaf cards, confidence rings, trail background, natural sunlight.", "4:5"],
  ["lm-scene-90s-childhood-game-room", "Nineties Childhood Game Room", "photography", ["90s", "game room", "nostalgia"], "Create a nostalgic 1990s childhood game room, chunky TV glow, carpet texture, toy boxes, snack bowl, warm evening light, no real game logos.", "3:2"],
  ["lm-scene-fireworks-sky-message", "Fireworks Celebration Sky", "poster", ["fireworks", "celebration", "night"], "Create a celebratory fireworks night sky over a fictional harbor, sparkling trails forming abstract celebratory shapes, crowd silhouettes, no readable text.", "16:9"],
  ["lm-scene-theme-park-map", "Custom Theme Park Map", "infographic", ["theme park", "map", "fun"], "Create a colorful map of a fictional theme park, zones, rides, food courts, paths, icons, cheerful wayfinding hierarchy, no real park references.", "16:9"]
];

const targetItems = items.slice(0, 100);
if (targetItems.length !== 100) {
  throw new Error(`Expected exactly 100 items, got ${targetItems.length}`);
}

function toQueueItem(raw, index) {
  const [id, title, category, tags, prompt, aspectRatio] = raw;
  return {
    id,
    title,
    category,
    tags,
    prompt,
    sourceLabel: "LeaderAI market-signal remix",
    sourceUrl,
    sourceNote: "Category distribution, tag frequency, card UX, and commercial image patterns were studied; source prompts are not copied.",
    categorySignalUrl,
    negativePrompt: negativeByCategory[category] || "no logos, no watermark, no copied style",
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
      "Original PromptArc asset. Use the competitor category as market signal only; do not copy any source prompt, image, person, brand, logo, or composition exactly.",
      `Final format: ${item.aspectRatio} composition, commercial thumbnail strength, clean subject focus, high visual variety across the batch.`,
      `Negative prompt: ${item.negativePrompt}.`
    ].join(" "),
    size: sizeByRatio[item.aspectRatio] || "1024x1536",
    quality: "low",
    output_format: "png",
    out: `${item.id}.png`
  })
);

fs.writeFileSync(jsonPath, `${JSON.stringify(queue, null, 2)}\n`, "utf8");
fs.writeFileSync(jsonlPath, `${jobs.join("\n")}\n`, "utf8");

console.log(`Wrote ${queue.length} LeaderAI market-signal remix prompt items.`);
console.log(jsonPath);
console.log(jsonlPath);
