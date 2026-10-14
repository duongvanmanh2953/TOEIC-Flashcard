// ============================================================================
// KIDS COMPREHENSIVE VOCABULARY DATA
// Foundational, high-frequency words for preschool and early elementary kids
// 160+ words across 12 categories - optimized for ages 3-8
// ============================================================================

export interface VocabularyItem {
  id: string;
  word: string;
  phonetic: string;
  viMeaning: string;
  category: string;
  /** Learning stage: sprout (beginner), plant (intermediate), tree (mastered) */
  stage?: "sprout" | "plant" | "tree";
  /** Difficulty level: 1 = Easy (3-4yr), 2 = Medium (4-5yr), 3 = Hard (5-7yr) */
  difficulty?: 1 | 2 | 3;
  phrase: string;
  sentence: string;
  emoji?: string;
  /** Path to 3D kawaii image in /kid/ public assets (e.g. '/kid/animals/cat.png') */
  imagePath?: string;
}

export const COMPREHENSIVE_VOCABULARY: VocabularyItem[] = [
  // === ANIMALS (15) ===
  { id: "vocab_cat", word: "cat", phonetic: "/kaet/", viMeaning: "Con mèo", category: "animals", stage: "tree", difficulty: 1, phrase: "a cute cat", sentence: "The cat is sleeping on the mat.", emoji: "\u{1F431}", imagePath: "/kid/animals/cat.png" },
  { id: "vocab_dog", word: "dog", phonetic: "/dog/", viMeaning: "Con chó", category: "animals", stage: "tree", difficulty: 1, phrase: "a friendly dog", sentence: "The dog wags its tail happily.", emoji: "\u{1F436}", imagePath: "/kid/animals/dog.png" },
  { id: "vocab_rabbit", word: "rabbit", phonetic: "/rab.it/", viMeaning: "Con thỏ", category: "animals", stage: "plant", difficulty: 2, phrase: "a white rabbit", sentence: "The rabbit loves eating carrots.", emoji: "\u{1F430}", imagePath: "/kid/animals/rabbit.png" },
  { id: "vocab_lion", word: "lion", phonetic: "/lai.en/", viMeaning: "Sư tử", category: "animals", stage: "tree", difficulty: 1, phrase: "the brave lion", sentence: "The lion is the king of the jungle.", emoji: "\u{1F981}", imagePath: "/kid/animals/lion.png" },
  { id: "vocab_elephant", word: "elephant", phonetic: "/el.i.fent/", viMeaning: "Con voi", category: "animals", stage: "plant", difficulty: 2, phrase: "a big elephant", sentence: "The elephant has a long trunk.", emoji: "\u{1F418}", imagePath: "/kid/animals/elephant.png" },
  { id: "vocab_bear", word: "bear", phonetic: "/beer/", viMeaning: "Con gấu", category: "animals", stage: "sprout", difficulty: 1, phrase: "a brown bear", sentence: "The bear likes eating sweet honey.", emoji: "\u{1F43B}", imagePath: "/kid/animals/bear.png" },
  { id: "vocab_monkey", word: "monkey", phonetic: "/mung.ki/", viMeaning: "Con khỉ", category: "animals", stage: "plant", difficulty: 2, phrase: "a clever monkey", sentence: "The monkey climbs the tall tree.", emoji: "\u{1F435}", imagePath: "/kid/animals/monkey.png" },
  { id: "vocab_frog", word: "frog", phonetic: "/frog/", viMeaning: "Con ếch", category: "animals", stage: "sprout", difficulty: 1, phrase: "a green frog", sentence: "The green frog hops across the pond.", emoji: "\u{1F438}", imagePath: "/kid/animals/frog.png" },
  { id: "vocab_bird", word: "bird", phonetic: "/berd/", viMeaning: "Con chim", category: "animals", stage: "tree", difficulty: 1, phrase: "a singing bird", sentence: "The little bird sings in the morning.", emoji: "\u{1F426}", imagePath: "/kid/animals/bird.png" },
  { id: "vocab_duck", word: "duck", phonetic: "/duk/", viMeaning: "Con vịt", category: "animals", stage: "sprout", difficulty: 1, phrase: "a yellow duck", sentence: "The duck swims across the river.", emoji: "\u{1F986}", imagePath: "/kid/animals/bird.png" },
  { id: "vocab_fish", word: "fish", phonetic: "/fish/", viMeaning: "Con cá", category: "animals", stage: "tree", difficulty: 1, phrase: "a goldfish", sentence: "The goldfish swims in clear water.", emoji: "\u{1F41F}", imagePath: "/kid/animals/dolphin.png" },
  { id: "vocab_turtle", word: "turtle", phonetic: "/ter.tel/", viMeaning: "Con rùa", category: "animals", stage: "plant", difficulty: 2, phrase: "a slow turtle", sentence: "The turtle walks very slowly.", emoji: "\u{1F422}", imagePath: "/kid/animals/turtle.png" },
  { id: "vocab_butterfly", word: "butterfly", phonetic: "/but.e.flai/", viMeaning: "Con bướm", category: "animals", stage: "plant", difficulty: 2, phrase: "a colorful butterfly", sentence: "The butterfly flies around the flowers.", emoji: "\u{1F98B}", imagePath: "/kid/animals/butterfly.png" },
  { id: "vocab_horse", word: "horse", phonetic: "/hors/", viMeaning: "Con ngựa", category: "animals", stage: "plant", difficulty: 2, phrase: "a fast horse", sentence: "The horse runs fast in the field.", emoji: "\u{1F434}", imagePath: "/kid/animals/zebra.png" },
  { id: "vocab_pig", word: "pig", phonetic: "/pig/", viMeaning: "Con heo", category: "animals", stage: "sprout", difficulty: 1, phrase: "a pink pig", sentence: "The little pig plays in the mud.", emoji: "\u{1F437}", imagePath: "/kid/animals/panda.png" },

  // === FRUITS & FOOD (15) ===
  { id: "vocab_apple", word: "apple", phonetic: "/ap.el/", viMeaning: "Quả táo", category: "fruits", stage: "tree", difficulty: 1, phrase: "a sweet red apple", sentence: "An apple a day keeps the doctor away.", emoji: "\u{1F34E}", imagePath: "/kid/food/apple.jpg" },
  { id: "vocab_banana", word: "banana", phonetic: "/ba.na.na/", viMeaning: "Quả chuối", category: "fruits", stage: "tree", difficulty: 1, phrase: "a yellow banana", sentence: "The monkey is eating a sweet banana.", emoji: "\u{1F34C}", imagePath: "/kid/food/banana.jpg" },
  { id: "vocab_orange", word: "orange", phonetic: "/or.inj/", viMeaning: "Quả cam", category: "fruits", stage: "tree", difficulty: 1, phrase: "a juicy orange", sentence: "I drink fresh orange juice every morning.", emoji: "\u{1F34A}" },
  { id: "vocab_grape", word: "grape", phonetic: "/greip/", viMeaning: "Quả nho", category: "fruits", stage: "plant", difficulty: 2, phrase: "purple grapes", sentence: "The grapes are sweet and delicious.", emoji: "\u{1F347}" },
  { id: "vocab_watermelon", word: "watermelon", phonetic: "/wo.ter.mel.en/", viMeaning: "Quả dưa hấu", category: "fruits", stage: "plant", difficulty: 2, phrase: "a big watermelon", sentence: "We eat watermelon on hot summer days.", emoji: "\u{1F349}" },
  { id: "vocab_strawberry", word: "strawberry", phonetic: "/stro.ber.i/", viMeaning: "Quả dâu tây", category: "fruits", stage: "tree", difficulty: 2, phrase: "sweet red strawberry", sentence: "The strawberry cake tastes wonderful.", emoji: "\u{1F353}" },
  { id: "vocab_pizza", word: "pizza", phonetic: "/peet.sa/", viMeaning: "Bánh pizza", category: "fruits", stage: "plant", difficulty: 1, phrase: "delicious cheese pizza", sentence: "We share a hot pizza for dinner.", emoji: "\u{1F355}", imagePath: "/kid/food/pizza.jpg" },
  { id: "vocab_burger", word: "burger", phonetic: "/ber.ger/", viMeaning: "Bánh kẹp burger", category: "fruits", stage: "sprout", difficulty: 1, phrase: "a tasty burger", sentence: "He enjoys a burger with fresh lettuce.", emoji: "\u{1F354}", imagePath: "/kid/food/burger.jpg" },
  { id: "vocab_milk", word: "milk", phonetic: "/milk/", viMeaning: "Sữa tươi", category: "fruits", stage: "tree", difficulty: 1, phrase: "a glass of fresh milk", sentence: "Drink warm milk before sleeping.", emoji: "\u{1F95B}", imagePath: "/kid/food/milk.jpg" },
  { id: "vocab_bread", word: "bread", phonetic: "/bred/", viMeaning: "Bánh mì", category: "fruits", stage: "sprout", difficulty: 1, phrase: "crispy warm bread", sentence: "I eat bread and butter for breakfast.", emoji: "\u{1F35E}", imagePath: "/kid/food/bread.jpg" },
  { id: "vocab_carrot", word: "carrot", phonetic: "/kar.et/", viMeaning: "Củ cà rốt", category: "fruits", stage: "plant", difficulty: 2, phrase: "a crunchy orange carrot", sentence: "Rabbits love eating fresh carrots.", emoji: "\u{1F955}", imagePath: "/kid/food/carrot.jpg" },
  { id: "vocab_cookie", word: "cookie", phonetic: "/kuk.i/", viMeaning: "Bánh quy", category: "fruits", stage: "sprout", difficulty: 1, phrase: "chocolate chip cookie", sentence: "Grandma baked sweet cookies today.", emoji: "\u{1F36A}" },
  { id: "vocab_rice", word: "rice", phonetic: "/rais/", viMeaning: "Cơm / Gạo", category: "fruits", stage: "tree", difficulty: 1, phrase: "a bowl of rice", sentence: "We eat rice with chicken for lunch.", emoji: "\u{1F35A}" },
  { id: "vocab_egg", word: "egg", phonetic: "/eg/", viMeaning: "Quả trứng", category: "fruits", stage: "sprout", difficulty: 1, phrase: "a boiled egg", sentence: "Mom cooks eggs for breakfast every day.", emoji: "\u{1F95A}" },
  { id: "vocab_water", word: "water", phonetic: "/wo.ter/", viMeaning: "Nước", category: "fruits", stage: "tree", difficulty: 1, phrase: "a cup of water", sentence: "Please drink more water every day.", emoji: "\u{1F4A7}" },

  // === TRANSPORT (10) ===
  { id: "vocab_car", word: "car", phonetic: "/kar/", viMeaning: "Xe ô tô", category: "transport", stage: "tree", difficulty: 1, phrase: "a shiny red car", sentence: "My dad drives a red car to work.", emoji: "\u{1F697}", imagePath: "/kid/transport/car.jpg" },
  { id: "vocab_bus", word: "bus", phonetic: "/bus/", viMeaning: "Xe buýt", category: "transport", stage: "tree", difficulty: 1, phrase: "the yellow school bus", sentence: "Children ride the bus to school.", emoji: "\u{1F68C}", imagePath: "/kid/transport/bus.jpg" },
  { id: "vocab_train", word: "train", phonetic: "/trein/", viMeaning: "Tàu hỏa", category: "transport", stage: "plant", difficulty: 2, phrase: "a long fast train", sentence: "The train moves smoothly along the rails.", emoji: "\u{1F682}", imagePath: "/kid/transport/train.jpg" },
  { id: "vocab_rocket", word: "rocket", phonetic: "/rok.it/", viMeaning: "Tên lửa vũ trụ", category: "transport", stage: "tree", difficulty: 2, phrase: "a powerful space rocket", sentence: "The rocket flies high into the stars.", emoji: "\u{1F680}", imagePath: "/kid/transport/rocket.jpg" },
  { id: "vocab_airplane", word: "airplane", phonetic: "/er.plein/", viMeaning: "Máy bay", category: "transport", stage: "plant", difficulty: 2, phrase: "a silver airplane", sentence: "The airplane soars above white clouds.", emoji: "\u{2708}\u{FE0F}" },
  { id: "vocab_boat", word: "boat", phonetic: "/bout/", viMeaning: "Con thuyền", category: "transport", stage: "sprout", difficulty: 1, phrase: "a small sailboat", sentence: "The boat sails on the calm blue sea.", emoji: "\u{26F5}" },
  { id: "vocab_bicycle", word: "bicycle", phonetic: "/bai.si.kel/", viMeaning: "Xe đạp", category: "transport", stage: "tree", difficulty: 2, phrase: "ride my bicycle", sentence: "I ride my bicycle in the green park.", emoji: "\u{1F6B2}" },
  { id: "vocab_helicopter", word: "helicopter", phonetic: "/hel.i.kop.ter/", viMeaning: "Trực thăng", category: "transport", stage: "plant", difficulty: 3, phrase: "a flying helicopter", sentence: "The helicopter flies over the city.", emoji: "\u{1F681}" },
  { id: "vocab_motorcycle", word: "motorcycle", phonetic: "/mo.te.sai.kel/", viMeaning: "Xe máy", category: "transport", stage: "plant", difficulty: 3, phrase: "a fast motorcycle", sentence: "Dad rides a motorcycle to the market.", emoji: "\u{1F3CD}\u{FE0F}" },
  { id: "vocab_ship", word: "ship", phonetic: "/ship/", viMeaning: "Tàu thủy", category: "transport", stage: "sprout", difficulty: 1, phrase: "a big cruise ship", sentence: "The ship sails across the ocean.", emoji: "\u{1F6A2}" },

  // === SCHOOL (10) ===
  { id: "vocab_book", word: "book", phonetic: "/buk/", viMeaning: "Quyển sách", category: "school", stage: "tree", difficulty: 1, phrase: "an interesting picture book", sentence: "I open the book and read a story.", emoji: "\u{1F4D6}", imagePath: "/kid/school/book.jpg" },
  { id: "vocab_pencil", word: "pencil", phonetic: "/pen.sel/", viMeaning: "Bút chì", category: "school", stage: "tree", difficulty: 1, phrase: "a sharp pencil", sentence: "Draw a sunny picture with your pencil.", emoji: "\u{270F}\u{FE0F}" },
  { id: "vocab_clock", word: "clock", phonetic: "/klok/", viMeaning: "Dong ho", category: "school", stage: "plant", phrase: "the round wall clock", sentence: "The clock shows seven in the morning.", emoji: "\u{23F0}" },
  { id: "vocab_bag", word: "bag", phonetic: "/bag/", viMeaning: "Cap sach", category: "school", stage: "sprout", phrase: "a school bag", sentence: "I put my books in my school bag.", emoji: "\u{1F392}" },
  { id: "vocab_ruler", word: "ruler", phonetic: "/ru.ler/", viMeaning: "Thuoc ke", category: "school", stage: "plant", phrase: "a long ruler", sentence: "I use a ruler to draw straight lines.", emoji: "\u{1F4CF}" },
  { id: "vocab_eraser", word: "eraser", phonetic: "/i.rei.zer/", viMeaning: "Cuc tay", category: "school", stage: "sprout", phrase: "a white eraser", sentence: "I use an eraser to fix my mistakes.", emoji: "\u{1F9F9}" },
  { id: "vocab_crayon", word: "crayon", phonetic: "/krei.on/", viMeaning: "But sap mau", category: "school", stage: "sprout", phrase: "colorful crayons", sentence: "I color the picture with my crayons.", emoji: "\u{1F58D}\u{FE0F}" },
  { id: "vocab_paper", word: "paper", phonetic: "/pei.per/", viMeaning: "Giay", category: "school", stage: "sprout", phrase: "a piece of paper", sentence: "Please write your name on the paper.", emoji: "\u{1F4C4}" },
  { id: "vocab_teacher", word: "teacher", phonetic: "/ti.cher/", viMeaning: "Giao vien", category: "school", stage: "tree", phrase: "a kind teacher", sentence: "The teacher helps us learn new words.", emoji: "\u{1F469}\u{200D}\u{1F3EB}" },
  { id: "vocab_star", word: "star", phonetic: "/star/", viMeaning: "Ngoi sao", category: "school", stage: "tree", phrase: "a golden star", sentence: "I got a gold star for my homework.", emoji: "\u{2B50}" },

  // === NATURE & WEATHER (12) ===
  { id: "vocab_sun", word: "sun", phonetic: "/sun/", viMeaning: "Mat troi", category: "nature", stage: "tree", phrase: "bright warm sun", sentence: "The sun shines brightly in the sky.", emoji: "\u{2600}\u{FE0F}" },
  { id: "vocab_cloud", word: "cloud", phonetic: "/klaud/", viMeaning: "Dam may", category: "nature", stage: "plant", phrase: "a fluffy white cloud", sentence: "The cloud floats gently across the sky.", emoji: "\u{2601}\u{FE0F}" },
  { id: "vocab_rain", word: "rain", phonetic: "/rein/", viMeaning: "Mua", category: "nature", stage: "tree", phrase: "heavy rain", sentence: "We need an umbrella when it rains.", emoji: "\u{1F327}\u{FE0F}" },
  { id: "vocab_snow", word: "snow", phonetic: "/snou/", viMeaning: "Tuyet", category: "nature", stage: "plant", phrase: "white snow", sentence: "We make a snowman when it snows.", emoji: "\u{2744}\u{FE0F}" },
  { id: "vocab_rainbow", word: "rainbow", phonetic: "/rein.bou/", viMeaning: "Cau vong", category: "nature", stage: "tree", phrase: "a beautiful rainbow", sentence: "A rainbow appears after the rain.", emoji: "\u{1F308}" },
  { id: "vocab_moon", word: "moon", phonetic: "/mun/", viMeaning: "Mat trang", category: "nature", stage: "plant", phrase: "the round moon", sentence: "The moon shines at night.", emoji: "\u{1F319}" },
  { id: "vocab_tree", word: "tree", phonetic: "/tri/", viMeaning: "Cai cay", category: "nature", stage: "tree", phrase: "a tall green tree", sentence: "Birds build nests in the big tree.", emoji: "\u{1F333}" },
  { id: "vocab_flower", word: "flower", phonetic: "/flau.er/", viMeaning: "Bong hoa", category: "nature", stage: "tree", phrase: "a pretty flower", sentence: "The flowers bloom in the garden.", emoji: "\u{1F338}" },
  { id: "vocab_wind", word: "wind", phonetic: "/wind/", viMeaning: "Gio", category: "nature", stage: "sprout", phrase: "strong wind", sentence: "The wind blows the leaves gently.", emoji: "\u{1F4A8}" },
  { id: "vocab_river", word: "river", phonetic: "/riv.er/", viMeaning: "Con song", category: "nature", stage: "plant", phrase: "a long river", sentence: "The river flows through the green valley.", emoji: "\u{1F3DE}\u{FE0F}" },
  { id: "vocab_mountain", word: "mountain", phonetic: "/maun.tin/", viMeaning: "Ngon nui", category: "nature", stage: "plant", phrase: "a tall mountain", sentence: "The mountain is covered with white snow.", emoji: "\u{26F0}\u{FE0F}" },
  { id: "vocab_sea", word: "sea", phonetic: "/si/", viMeaning: "Bien", category: "nature", stage: "tree", phrase: "the blue sea", sentence: "We play on the beach by the sea.", emoji: "\u{1F30A}" },

  // === FAMILY (12) ===
  { id: "vocab_mom", word: "mom", phonetic: "/mom/", viMeaning: "Me", category: "family", stage: "tree", phrase: "my lovely mom", sentence: "Mom cooks delicious food for us.", emoji: "\u{1F469}" },
  { id: "vocab_dad", word: "dad", phonetic: "/dad/", viMeaning: "Bo", category: "family", stage: "tree", phrase: "my strong dad", sentence: "Dad reads a bedtime story every night.", emoji: "\u{1F468}" },
  { id: "vocab_sister", word: "sister", phonetic: "/sis.ter/", viMeaning: "Chi / Em gai", category: "family", stage: "tree", phrase: "my little sister", sentence: "My sister and I play together.", emoji: "\u{1F467}" },
  { id: "vocab_brother", word: "brother", phonetic: "/bru.ther/", viMeaning: "Anh / Em trai", category: "family", stage: "tree", phrase: "my older brother", sentence: "My brother teaches me how to ride a bike.", emoji: "\u{1F466}" },
  { id: "vocab_grandma", word: "grandma", phonetic: "/gran.ma/", viMeaning: "Ba noi / ngoai", category: "family", stage: "plant", phrase: "dear grandma", sentence: "Grandma tells us wonderful fairy tales.", emoji: "\u{1F475}" },
  { id: "vocab_grandpa", word: "grandpa", phonetic: "/gran.pa/", viMeaning: "Ong noi / ngoai", category: "family", stage: "plant", phrase: "dear grandpa", sentence: "Grandpa takes us to the park on Sundays.", emoji: "\u{1F474}" },
  { id: "vocab_baby", word: "baby", phonetic: "/bei.bi/", viMeaning: "Em be", category: "family", stage: "tree", phrase: "a cute baby", sentence: "The baby laughs and claps his hands.", emoji: "\u{1F476}" },
  { id: "vocab_friend", word: "friend", phonetic: "/frend/", viMeaning: "Ban be", category: "family", stage: "tree", phrase: "my best friend", sentence: "I play with my friends at school.", emoji: "\u{1F91D}" },
  { id: "vocab_family", word: "family", phonetic: "/fam.e.li/", viMeaning: "Gia dinh", category: "family", stage: "tree", phrase: "a happy family", sentence: "Our family eats dinner together.", emoji: "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}\u{200D}\u{1F466}" },
  { id: "vocab_boy", word: "boy", phonetic: "/boi/", viMeaning: "Cau be", category: "family", stage: "tree", phrase: "a happy boy", sentence: "The boy plays football in the park.", emoji: "\u{1F466}" },
  { id: "vocab_girl", word: "girl", phonetic: "/gerl/", viMeaning: "Co be", category: "family", stage: "tree", phrase: "a smart girl", sentence: "The girl reads a book under the tree.", emoji: "\u{1F467}" },
  { id: "vocab_king", word: "king", phonetic: "/king/", viMeaning: "Vua", category: "family", stage: "plant", phrase: "the brave king", sentence: "The king lives in a grand castle.", emoji: "\u{1F934}" },

  // === COLORS & SHAPES (14) ===
  { id: "vocab_red", word: "red", phonetic: "/red/", viMeaning: "Mau do", category: "colors", stage: "tree", phrase: "a red heart", sentence: "The apple is bright red.", emoji: "\u{2764}\u{FE0F}" },
  { id: "vocab_blue", word: "blue", phonetic: "/blu/", viMeaning: "Mau xanh duong", category: "colors", stage: "tree", phrase: "the blue sky", sentence: "The sky is very blue today.", emoji: "\u{1F499}" },
  { id: "vocab_green", word: "green", phonetic: "/grin/", viMeaning: "Mau xanh la", category: "colors", stage: "tree", phrase: "green grass", sentence: "The grass is green in spring.", emoji: "\u{1F49A}" },
  { id: "vocab_yellow", word: "yellow", phonetic: "/yel.ou/", viMeaning: "Mau vang", category: "colors", stage: "tree", phrase: "a yellow sun", sentence: "The sun is big and yellow.", emoji: "\u{1F49B}" },
  { id: "vocab_pink", word: "pink", phonetic: "/pink/", viMeaning: "Mau hong", category: "colors", stage: "tree", phrase: "pink flowers", sentence: "She wears a pretty pink dress.", emoji: "\u{1F497}" },
  { id: "vocab_purple", word: "purple", phonetic: "/per.pel/", viMeaning: "Mau tim", category: "colors", stage: "plant", phrase: "purple grapes", sentence: "The purple butterfly is beautiful.", emoji: "\u{1F49C}" },
  { id: "vocab_white", word: "white", phonetic: "/wait/", viMeaning: "Mau trang", category: "colors", stage: "tree", phrase: "a white cloud", sentence: "The rabbit has soft white fur.", emoji: "\u{1F90D}" },
  { id: "vocab_black", word: "black", phonetic: "/blak/", viMeaning: "Mau den", category: "colors", stage: "tree", phrase: "a black cat", sentence: "The black cat sits on the fence.", emoji: "\u{1F5A4}" },
  { id: "vocab_brown", word: "brown", phonetic: "/braun/", viMeaning: "Mau nau", category: "colors", stage: "plant", phrase: "a brown bear", sentence: "The brown teddy bear is so cuddly.", emoji: "\u{1F90E}" },
  { id: "vocab_color_orange", word: "orange", phonetic: "/or.inj/", viMeaning: "Mau cam", category: "colors", stage: "tree", phrase: "an orange pumpkin", sentence: "The pumpkin is bright orange.", emoji: "\u{1F9E1}" },
  { id: "vocab_circle", word: "circle", phonetic: "/ser.kel/", viMeaning: "Hinh tron", category: "colors", stage: "sprout", phrase: "a round circle", sentence: "Draw a big circle on the paper.", emoji: "\u{2B55}" },
  { id: "vocab_square", word: "square", phonetic: "/skwer/", viMeaning: "Hinh vuong", category: "colors", stage: "sprout", phrase: "a blue square", sentence: "The window has a square shape.", emoji: "\u{1F7E6}" },
  { id: "vocab_triangle", word: "triangle", phonetic: "/trai.ang.gel/", viMeaning: "Hinh tam giac", category: "colors", stage: "plant", phrase: "a pointed triangle", sentence: "The roof has a triangle shape.", emoji: "\u{1F53A}" },
  { id: "vocab_heart", word: "heart", phonetic: "/hart/", viMeaning: "Hinh trai tim", category: "colors", stage: "tree", phrase: "a red heart", sentence: "I draw a heart for my mom.", emoji: "\u{2764}\u{FE0F}" },

  // === NUMBERS (10) ===
  { id: "vocab_one", word: "one", phonetic: "/wun/", viMeaning: "So mot", category: "numbers", stage: "tree", phrase: "number one", sentence: "I have one nose.", emoji: "1\u{FE0F}\u{20E3}" },
  { id: "vocab_two", word: "two", phonetic: "/tu/", viMeaning: "So hai", category: "numbers", stage: "tree", phrase: "two hands", sentence: "I have two eyes to see.", emoji: "2\u{FE0F}\u{20E3}" },
  { id: "vocab_three", word: "three", phonetic: "/thri/", viMeaning: "So ba", category: "numbers", stage: "tree", phrase: "three bears", sentence: "There are three bears in the story.", emoji: "3\u{FE0F}\u{20E3}" },
  { id: "vocab_four", word: "four", phonetic: "/for/", viMeaning: "So bon", category: "numbers", stage: "plant", phrase: "four seasons", sentence: "A dog has four legs.", emoji: "4\u{FE0F}\u{20E3}" },
  { id: "vocab_five", word: "five", phonetic: "/faiv/", viMeaning: "So nam", category: "numbers", stage: "tree", phrase: "five fingers", sentence: "I have five fingers on each hand.", emoji: "5\u{FE0F}\u{20E3}" },
  { id: "vocab_six", word: "six", phonetic: "/siks/", viMeaning: "So sau", category: "numbers", stage: "plant", phrase: "six cookies", sentence: "There are six cookies on the plate.", emoji: "6\u{FE0F}\u{20E3}" },
  { id: "vocab_seven", word: "seven", phonetic: "/sev.en/", viMeaning: "So bay", category: "numbers", stage: "plant", phrase: "seven colors", sentence: "The rainbow has seven beautiful colors.", emoji: "7\u{FE0F}\u{20E3}" },
  { id: "vocab_eight", word: "eight", phonetic: "/eit/", viMeaning: "So tam", category: "numbers", stage: "plant", phrase: "eight legs", sentence: "An octopus has eight long legs.", emoji: "8\u{FE0F}\u{20E3}" },
  { id: "vocab_nine", word: "nine", phonetic: "/nain/", viMeaning: "So chin", category: "numbers", stage: "plant", phrase: "nine stars", sentence: "I can count up to nine stars.", emoji: "9\u{FE0F}\u{20E3}" },
  { id: "vocab_ten", word: "ten", phonetic: "/ten/", viMeaning: "So muoi", category: "numbers", stage: "tree", phrase: "ten little ducks", sentence: "Ten little ducks swim in the pond.", emoji: "\u{1F51F}" },

  // === BODY PARTS (12) ===
  { id: "vocab_head", word: "head", phonetic: "/hed/", viMeaning: "Cai dau", category: "body", stage: "tree", phrase: "my head", sentence: "I wear a hat on my head.", emoji: "\u{1F5E3}\u{FE0F}" },
  { id: "vocab_hand", word: "hand", phonetic: "/hand/", viMeaning: "Ban tay", category: "body", stage: "tree", phrase: "clean hands", sentence: "Wash your hands before eating.", emoji: "\u{270B}" },
  { id: "vocab_eye", word: "eye", phonetic: "/ai/", viMeaning: "Mat", category: "body", stage: "tree", phrase: "bright eyes", sentence: "I use my eyes to see the world.", emoji: "\u{1F441}\u{FE0F}" },
  { id: "vocab_ear", word: "ear", phonetic: "/ier/", viMeaning: "Tai", category: "body", stage: "tree", phrase: "big ears", sentence: "The rabbit has very long ears.", emoji: "\u{1F442}" },
  { id: "vocab_nose", word: "nose", phonetic: "/nouz/", viMeaning: "Mui", category: "body", stage: "tree", phrase: "a small nose", sentence: "I smell flowers with my nose.", emoji: "\u{1F443}" },
  { id: "vocab_mouth", word: "mouth", phonetic: "/mauth/", viMeaning: "Mieng", category: "body", stage: "tree", phrase: "open your mouth", sentence: "Open your mouth and say ahh.", emoji: "\u{1F444}" },
  { id: "vocab_leg", word: "leg", phonetic: "/leg/", viMeaning: "Chan", category: "body", stage: "plant", phrase: "long legs", sentence: "I run fast with my strong legs.", emoji: "\u{1F9B5}" },
  { id: "vocab_foot", word: "foot", phonetic: "/fut/", viMeaning: "Ban chan", category: "body", stage: "plant", phrase: "my left foot", sentence: "I kick the ball with my right foot.", emoji: "\u{1F9B6}" },
  { id: "vocab_finger", word: "finger", phonetic: "/fing.ger/", viMeaning: "Ngon tay", category: "body", stage: "plant", phrase: "five fingers", sentence: "I point with my finger.", emoji: "\u{261D}\u{FE0F}" },
  { id: "vocab_hair", word: "hair", phonetic: "/her/", viMeaning: "Toc", category: "body", stage: "plant", phrase: "long hair", sentence: "She has beautiful long black hair.", emoji: "\u{1F487}" },
  { id: "vocab_teeth", word: "teeth", phonetic: "/tith/", viMeaning: "Rang", category: "body", stage: "sprout", phrase: "white teeth", sentence: "Brush your teeth every morning.", emoji: "\u{1F9B7}" },
  { id: "vocab_tummy", word: "tummy", phonetic: "/tum.i/", viMeaning: "Bung", category: "body", stage: "sprout", phrase: "a full tummy", sentence: "My tummy is full after dinner.", emoji: "\u{1F60B}" },

  // === CLOTHES (8) ===
  { id: "vocab_shirt", word: "shirt", phonetic: "/shert/", viMeaning: "Ao so mi", category: "clothes", stage: "tree", phrase: "a blue shirt", sentence: "I wear a clean shirt to school.", emoji: "\u{1F455}" },
  { id: "vocab_pants", word: "pants", phonetic: "/pants/", viMeaning: "Quan dai", category: "clothes", stage: "tree", phrase: "blue pants", sentence: "I put on my pants in the morning.", emoji: "\u{1F456}" },
  { id: "vocab_shoes", word: "shoes", phonetic: "/shuz/", viMeaning: "Giay", category: "clothes", stage: "tree", phrase: "new red shoes", sentence: "I tie my shoes before going outside.", emoji: "\u{1F45F}" },
  { id: "vocab_hat", word: "hat", phonetic: "/hat/", viMeaning: "Mu / Non", category: "clothes", stage: "tree", phrase: "a funny hat", sentence: "I wear a hat when it is sunny.", emoji: "\u{1F3A9}" },
  { id: "vocab_dress", word: "dress", phonetic: "/dres/", viMeaning: "Vay dam", category: "clothes", stage: "plant", phrase: "a pretty dress", sentence: "She wears a beautiful pink dress.", emoji: "\u{1F457}" },
  { id: "vocab_socks", word: "socks", phonetic: "/soks/", viMeaning: "Tat / Vo", category: "clothes", stage: "sprout", phrase: "warm socks", sentence: "I wear warm socks in the winter.", emoji: "\u{1F9E6}" },
  { id: "vocab_jacket", word: "jacket", phonetic: "/jak.it/", viMeaning: "Ao khoac", category: "clothes", stage: "plant", phrase: "a warm jacket", sentence: "Put on your jacket when it is cold.", emoji: "\u{1F9E5}" },
  { id: "vocab_glasses", word: "glasses", phonetic: "/gla.sez/", viMeaning: "Kinh mat", category: "clothes", stage: "plant", phrase: "cool glasses", sentence: "Grandpa wears glasses to read books.", emoji: "\u{1F453}" },

  // === HOUSE & ROOM (10) ===
  { id: "vocab_house", word: "house", phonetic: "/haus/", viMeaning: "Ngoi nha", category: "house", stage: "tree", phrase: "a big house", sentence: "I live in a cozy house with my family.", emoji: "\u{1F3E0}" },
  { id: "vocab_door", word: "door", phonetic: "/dor/", viMeaning: "Cua", category: "house", stage: "tree", phrase: "the front door", sentence: "Please close the door gently.", emoji: "\u{1F6AA}" },
  { id: "vocab_window", word: "window", phonetic: "/win.dou/", viMeaning: "Cua so", category: "house", stage: "plant", phrase: "a big window", sentence: "I look out the window at the garden.", emoji: "\u{1FA9F}" },
  { id: "vocab_bed", word: "bed", phonetic: "/bed/", viMeaning: "Cai giuong", category: "house", stage: "tree", phrase: "a soft bed", sentence: "I sleep in my warm bed at night.", emoji: "\u{1F6CF}\u{FE0F}" },
  { id: "vocab_table", word: "table", phonetic: "/tei.bel/", viMeaning: "Cai ban", category: "house", stage: "tree", phrase: "a round table", sentence: "We eat dinner at the table together.", emoji: "\u{1FA91}" },
  { id: "vocab_chair", word: "chair", phonetic: "/cher/", viMeaning: "Cai ghe", category: "house", stage: "plant", phrase: "a wooden chair", sentence: "Please sit on the chair.", emoji: "\u{1F4BA}" },
  { id: "vocab_lamp", word: "lamp", phonetic: "/lamp/", viMeaning: "Den", category: "house", stage: "sprout", phrase: "a bright lamp", sentence: "Turn on the lamp to read at night.", emoji: "\u{1F4A1}" },
  { id: "vocab_bathroom", word: "bathroom", phonetic: "/bath.rum/", viMeaning: "Phong tam", category: "house", stage: "plant", phrase: "a clean bathroom", sentence: "I brush my teeth in the bathroom.", emoji: "\u{1F6C1}" },
  { id: "vocab_kitchen", word: "kitchen", phonetic: "/kich.in/", viMeaning: "Nha bep", category: "house", stage: "plant", phrase: "the warm kitchen", sentence: "Mom cooks dinner in the kitchen.", emoji: "\u{1F373}" },
  { id: "vocab_garden", word: "garden", phonetic: "/gar.den/", viMeaning: "Vuon", category: "house", stage: "tree", phrase: "a beautiful garden", sentence: "We grow flowers in the garden.", emoji: "\u{1F33B}" },

  // === ACTIONS (15) ===
  { id: "vocab_run", word: "run", phonetic: "/run/", viMeaning: "Chay", category: "actions", stage: "tree", phrase: "run fast", sentence: "I run fast in the playground.", emoji: "\u{1F3C3}" },
  { id: "vocab_jump", word: "jump", phonetic: "/jump/", viMeaning: "Nhay", category: "actions", stage: "tree", phrase: "jump high", sentence: "The frog can jump very high.", emoji: "\u{1F998}" },
  { id: "vocab_eat", word: "eat", phonetic: "/it/", viMeaning: "An", category: "actions", stage: "tree", phrase: "eat lunch", sentence: "We eat lunch at twelve.", emoji: "\u{1F37D}\u{FE0F}" },
  { id: "vocab_drink", word: "drink", phonetic: "/drink/", viMeaning: "Uong", category: "actions", stage: "tree", phrase: "drink water", sentence: "Please drink more water every day.", emoji: "\u{1F964}" },
  { id: "vocab_sleep", word: "sleep", phonetic: "/slip/", viMeaning: "Ngu", category: "actions", stage: "tree", phrase: "time to sleep", sentence: "I sleep at nine every night.", emoji: "\u{1F634}" },
  { id: "vocab_play", word: "play", phonetic: "/plei/", viMeaning: "Choi", category: "actions", stage: "tree", phrase: "play outside", sentence: "I play with my toys after school.", emoji: "\u{1F3AE}" },
  { id: "vocab_sing", word: "sing", phonetic: "/sing/", viMeaning: "Hat", category: "actions", stage: "tree", phrase: "sing a song", sentence: "We sing happy songs together.", emoji: "\u{1F3A4}" },
  { id: "vocab_dance", word: "dance", phonetic: "/dans/", viMeaning: "Nhay mua", category: "actions", stage: "plant", phrase: "dance to music", sentence: "The children dance and laugh happily.", emoji: "\u{1F483}" },
  { id: "vocab_read", word: "read", phonetic: "/rid/", viMeaning: "Doc", category: "actions", stage: "tree", phrase: "read a book", sentence: "I read a storybook before bedtime.", emoji: "\u{1F4DA}" },
  { id: "vocab_write", word: "write", phonetic: "/rait/", viMeaning: "Viet", category: "actions", stage: "plant", phrase: "write your name", sentence: "I write my name on the paper.", emoji: "\u{270D}\u{FE0F}" },
  { id: "vocab_draw", word: "draw", phonetic: "/dro/", viMeaning: "Ve", category: "actions", stage: "tree", phrase: "draw a picture", sentence: "I draw a picture of my family.", emoji: "\u{1F3A8}" },
  { id: "vocab_swim", word: "swim", phonetic: "/swim/", viMeaning: "Boi", category: "actions", stage: "plant", phrase: "swim in the pool", sentence: "Fish swim in the blue sea.", emoji: "\u{1F3CA}" },
  { id: "vocab_fly", word: "fly", phonetic: "/flai/", viMeaning: "Bay", category: "actions", stage: "plant", phrase: "fly like a bird", sentence: "The bird can fly high in the sky.", emoji: "\u{1F54A}\u{FE0F}" },
  { id: "vocab_cook", word: "cook", phonetic: "/kuk/", viMeaning: "Nau an", category: "actions", stage: "plant", phrase: "cook dinner", sentence: "Mom cooks yummy food for the family.", emoji: "\u{1F468}\u{200D}\u{1F373}" },
  { id: "vocab_clap", word: "clap", phonetic: "/klap/", viMeaning: "Vo tay", category: "actions", stage: "sprout", phrase: "clap your hands", sentence: "Clap your hands if you are happy.", emoji: "\u{1F44F}" },

  // === EMOTIONS (10) ===
  { id: "vocab_happy", word: "happy", phonetic: "/hap.i/", viMeaning: "Vui ve", category: "emotions", stage: "tree", phrase: "a happy smile", sentence: "I feel happy when I play with friends.", emoji: "\u{1F60A}" },
  { id: "vocab_sad", word: "sad", phonetic: "/sad/", viMeaning: "Buon", category: "emotions", stage: "tree", phrase: "feeling sad", sentence: "The puppy looks sad in the rain.", emoji: "\u{1F622}" },
  { id: "vocab_angry", word: "angry", phonetic: "/ang.gri/", viMeaning: "Tuc gian", category: "emotions", stage: "plant", phrase: "do not be angry", sentence: "Take a deep breath when you feel angry.", emoji: "\u{1F621}" },
  { id: "vocab_scared", word: "scared", phonetic: "/skerd/", viMeaning: "So hai", category: "emotions", stage: "plant", phrase: "feeling scared", sentence: "The cat is scared of loud thunder.", emoji: "\u{1F631}" },
  { id: "vocab_tired", word: "tired", phonetic: "/tai.erd/", viMeaning: "Met moi", category: "emotions", stage: "plant", phrase: "very tired", sentence: "I feel tired after running all day.", emoji: "\u{1F62B}" },
  { id: "vocab_hungry", word: "hungry", phonetic: "/hung.gri/", viMeaning: "Doi bung", category: "emotions", stage: "tree", phrase: "so hungry", sentence: "I am hungry and want to eat lunch.", emoji: "\u{1F924}" },
  { id: "vocab_love", word: "love", phonetic: "/luv/", viMeaning: "Yeu thuong", category: "emotions", stage: "tree", phrase: "I love you", sentence: "I love my mom and dad very much.", emoji: "\u{2764}\u{FE0F}" },
  { id: "vocab_brave", word: "brave", phonetic: "/breiv/", viMeaning: "Dung cam", category: "emotions", stage: "plant", phrase: "be brave", sentence: "The brave lion protects his friends.", emoji: "\u{1F4AA}" },
  { id: "vocab_excited", word: "excited", phonetic: "/ik.sai.tid/", viMeaning: "Hao hung", category: "emotions", stage: "plant", phrase: "very excited", sentence: "I am excited about my birthday party.", emoji: "\u{1F929}" },
  { id: "vocab_kind", word: "kind", phonetic: "/kaind/", viMeaning: "Tot bung", category: "emotions", stage: "tree", phrase: "be kind", sentence: "Be kind to everyone around you.", emoji: "\u{1F970}" },

  // === GREETINGS (10) ===
  { id: "vocab_hello", word: "hello", phonetic: "/he.lou/", viMeaning: "Xin chao", category: "greetings", stage: "tree", phrase: "hello everyone", sentence: "Hello! How are you today?", emoji: "\u{1F44B}" },
  { id: "vocab_goodbye", word: "goodbye", phonetic: "/gud.bai/", viMeaning: "Tam biet", category: "greetings", stage: "tree", phrase: "say goodbye", sentence: "Goodbye! See you tomorrow.", emoji: "\u{1F44B}" },
  { id: "vocab_please", word: "please", phonetic: "/pliz/", viMeaning: "Lam on", category: "greetings", stage: "tree", phrase: "yes please", sentence: "Please pass the salt.", emoji: "\u{1F64F}" },
  { id: "vocab_thank_you", word: "thank you", phonetic: "/thangk yu/", viMeaning: "Cam on", category: "greetings", stage: "tree", phrase: "thank you so much", sentence: "Thank you for helping me.", emoji: "\u{1F64F}" },
  { id: "vocab_sorry", word: "sorry", phonetic: "/sor.i/", viMeaning: "Xin loi", category: "greetings", stage: "tree", phrase: "I am sorry", sentence: "I am sorry for being late.", emoji: "\u{1F614}" },
  { id: "vocab_yes", word: "yes", phonetic: "/yes/", viMeaning: "Vang / Co", category: "greetings", stage: "tree", phrase: "yes I can", sentence: "Yes, I would like some more please.", emoji: "\u{2705}" },
  { id: "vocab_no", word: "no", phonetic: "/nou/", viMeaning: "Khong", category: "greetings", stage: "tree", phrase: "no thank you", sentence: "No, I am not hungry right now.", emoji: "\u{274C}" },
  { id: "vocab_good_morning", word: "good morning", phonetic: "/gud mor.ning/", viMeaning: "Chao buoi sang", category: "greetings", stage: "tree", phrase: "good morning teacher", sentence: "Good morning! Have a wonderful day!", emoji: "\u{1F305}" },
  { id: "vocab_good_night", word: "good night", phonetic: "/gud nait/", viMeaning: "Chuc ngu ngon", category: "greetings", stage: "tree", phrase: "good night mommy", sentence: "Good night! Sweet dreams!", emoji: "\u{1F319}" },
  { id: "vocab_help", word: "help", phonetic: "/help/", viMeaning: "Giup do", category: "greetings", stage: "tree", phrase: "can you help me", sentence: "Can you help me with this puzzle?", emoji: "\u{1F198}" },
];
