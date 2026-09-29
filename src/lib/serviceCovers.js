// AI-generated category cover images for service listings.
// Generated once (image tool) and referenced by permanent public URL —
// never generated per listing. Covers are auto-assigned based on category.

export const SERVICE_CATEGORIES = [
  "Home Repairs",
  "Cleaning",
  "Yard Work",
  "Digital Services",
  "Tutoring",
  "Personal Assistance",
  "Creative Services",
];

export const SERVICE_COVERS = {
  "Home Repairs": "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/5277c7f8b_generated_image.png",
  "Cleaning": "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/3be7d78a2_generated_image.png",
  "Yard Work": "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/ddeb98274_generated_image.png",
  "Digital Services": "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/c5bbdf247_generated_image.png",
  "Tutoring": "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/0b19ec8be_generated_image.png",
  "Personal Assistance": "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/d4c931c77_generated_image.png",
  "Creative Services": "https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/b3c0767d1_generated_image.png",
};

export const getServiceCover = (category) =>
  SERVICE_COVERS[category] || SERVICE_COVERS["Digital Services"];