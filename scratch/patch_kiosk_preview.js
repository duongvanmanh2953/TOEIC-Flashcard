const fs = require('fs');

// ==========================================================
// 1. UPDATE KioskPreview.vue
// ==========================================================
const previewPath = 'C:/Users/manhd/Desktop/tenant-web/src/views/admin/restaurant/kiosk/KioskPreview.vue';
let pContent = fs.readFileSync(previewPath, 'utf8');

// Add defineEmits and toggleOrientation + brokenImages logic right after props definition
const propsAnchor = '    kioskName: () => ({ vi: "Khu du lịch", en: "Resort" }),\n  }\n);';

const newScriptAdditions = `    kioskName: () => ({ vi: "Khu du lịch", en: "Resort" }),
  }
);

const emit = defineEmits<{
  (e: "update:orientation", val: "portrait" | "landscape"): void;
}>();

const toggleOrientation = () => {
  const next = isPortrait.value ? "landscape" : "portrait";
  emit("update:orientation", next);
};

// Track broken slide images and fallback to temporary image
const brokenImages = ref<Record<string, boolean>>({});

const handleImageError = (url?: string) => {
  if (url) {
    brokenImages.value = { ...brokenImages.value, [url.trim()]: true };
  }
};

const handleImageSuccess = (url?: string) => {
  if (url && brokenImages.value[url.trim()]) {
    const updated = { ...brokenImages.value };
    delete updated[url.trim()];
    brokenImages.value = updated;
  }
};

const isImageBroken = computed(() => {
  const url = currentSlide.value?.imageUrl?.trim();
  return url ? !!brokenImages.value[url] : false;
});`;

pContent = pContent.replace(propsAnchor, newScriptAdditions);

// Update currentSlideStyle to use fallback image when broken
const oldSlideStyle = `const currentSlideStyle = computed(() => {
  const s = currentSlide.value;
  const styleObj: Record<string, string> = {};

  if (s?.imageUrl && s.imageUrl.trim().length > 0) {
    styleObj.backgroundImage = \`url('\${s.imageUrl.trim()}')\`;
    styleObj.backgroundColor = s.color || "#090e1a";
    styleObj.backgroundSize = "cover";
    styleObj.backgroundPosition = "center";
  } else if (s?.color) {`;

const newSlideStyle = `const currentSlideStyle = computed(() => {
  const s = currentSlide.value;
  const styleObj: Record<string, string> = {};

  const effectiveImageUrl = isImageBroken.value
    ? "/images/img-default.png"
    : s?.imageUrl?.trim();

  if (effectiveImageUrl) {
    styleObj.backgroundImage = \`url('\${effectiveImageUrl}')\`;
    styleObj.backgroundColor = s?.color || "#090e1a";
    styleObj.backgroundSize = "cover";
    styleObj.backgroundPosition = "center";
  } else if (s?.color) {`;

pContent = pContent.replace(oldSlideStyle, newSlideStyle);

// Update kiosk-order-btn styling for reduced font size
const oldBtnStyle = `.kiosk-order-btn {
  background-color: #E11D48;
  color: #ffffff;
  border-radius: 9999px;
  padding: 8px 10px 8px 18px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.25), 0 8px 18px rgba(225, 29, 72, 0.5);
  gap: 10px;
  transition: all 0.2s ease;
  animation: pulse-ring 3s infinite;

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.4), 0 10px 24px rgba(225, 29, 72, 0.6);
  }

  &.btn-lg {
    padding: 10px 14px 10px 24px;
    font-size: 16px;
    gap: 14px;
  }

  .order-btn-arrow-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #ffffff;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}`;

const newBtnStyle = `.kiosk-order-btn {
  background-color: #E11D48;
  color: #ffffff;
  border-radius: 9999px;
  padding: 6px 8px 6px 14px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2px;
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.25), 0 8px 18px rgba(225, 29, 72, 0.5);
  gap: 8px;
  transition: all 0.2s ease;
  animation: pulse-ring 3s infinite;

  .order-btn-text {
    font-size: 11px;
    font-weight: 700;
  }

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.4), 0 10px 24px rgba(225, 29, 72, 0.6);
  }

  &.btn-lg {
    padding: 8px 12px 8px 20px;
    font-size: 13.5px;
    gap: 10px;

    .order-btn-text {
      font-size: 13.5px;
    }

    .order-btn-arrow-circle {
      width: 22px;
      height: 22px;
    }
  }

  .order-btn-arrow-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background-color: #ffffff;
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}`;

pContent = pContent.replace(oldBtnStyle, newBtnStyle);

fs.writeFileSync(previewPath, pContent, 'utf8');
console.log('KioskPreview.vue patched successfully!');

// ==========================================================
// 2. UPDATE KioskSlideEditor.vue
// ==========================================================
const editorPath = 'C:/Users/manhd/Desktop/tenant-web/src/views/admin/restaurant/kiosk/KioskSlideEditor.vue';
let eContent = fs.readFileSync(editorPath, 'utf8');

const oldOnImageError = `const onImageError = (e: Event) => {
  console.warn("Failed to load slide image:", e);
};`;

const newOnImageError = `const onImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  if (target && target.src !== "/images/img-default.png") {
    target.src = "/images/img-default.png";
  }
};`;

eContent = eContent.replace(oldOnImageError, newOnImageError);
fs.writeFileSync(editorPath, eContent, 'utf8');
console.log('KioskSlideEditor.vue patched successfully!');
