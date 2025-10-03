// productData.js
import cheesecake from "../assets/images/birthday_cake.JPG";
import chocolateFudgeBrownie from "../assets/images/brownie.webp";
import cookies from "../assets/images/cookies.webp";
import muffin from "../assets/images/cup_cake.JPG";
import teacake from "../assets/images/teacake.webp";

export const TABS = [
  { label: "Classic Picks", key: "classic" },
  { label: "Healthy & Tasty", key: "healthy" },
  { label: "New Arrivals", key: "new" },
];

export const PRODUCTS = [
  {
    images: [cheesecake,teacake],
    name: "New York Cheesecake",
    isVeg: true,
    weight: "500 GM",
    type: ["classic", "healthy","cake"],
    description: "A rich and creamy classic New York style cheesecake.",
    ingredients: "Cream cheese, sugar, eggs, graham cracker crust, vanilla extract.",
    delivery_instructions: "Keep refrigerated; consume within 3 days of delivery."
  },
  {
    images: [chocolateFudgeBrownie],
    name: "Dessert Chocolate Fudge",
    isVeg: false,
    weight: "500 GM",
    type: ["classic", "new", "brownie"],
    description: "Decadent and fudgy chocolate dessert brownie.",
    ingredients: "Cocoa powder, sugar, butter, eggs, flour, vanilla essence.",
    delivery_instructions: "Store in a cool dry place; best before 5 days."
  },
  {
    images: [cookies],
    name: "Burley Cookie",
    isVeg: false,
    weight: "500 GM",
    type: ["classic","healthy", "cookie"],
    description: "Crunchy and nutritious cookies made with millet flour.",
    ingredients: "Millet flour, honey, butter, baking soda, vanilla.",
    delivery_instructions: "Keep in airtight container; best consumed within 7 days."
  },
  {
    images: [cookies],
    name: "Oreo Cookie",
    isVeg: false,
    weight: "500 GM",
    type: ["classic","healthy", "cookie"],
    description: "Crunchy and nutritious cookies made with millet flour.",
    ingredients: "Millet flour, honey, butter, baking soda, vanilla.",
    delivery_instructions: "Keep in airtight container; best consumed within 7 days."
  },
  {
    images: [cookies],
    name: "Millet Cookie",
    isVeg: false,
    weight: "500 GM",
    type: ["classic","healthy", "cookie"],
    description: "Crunchy and nutritious cookies made with millet flour.",
    ingredients: "Millet flour, honey, butter, baking soda, vanilla.",
    delivery_instructions: "Keep in airtight container; best consumed within 7 days."
  },
  {
    images: [muffin],
    name: "Chocolate Cup Cake",
    isVeg: true,
    weight: "700 GM",
    type: ["classic", "healthy", "cup_cake"],
    description: "Soft and fluffy chocolate cup cakes, perfect for breakfast.",
    ingredients: "Flour, cocoa powder, sugar, eggs, butter, baking powder.",
    delivery_instructions: "Store at room temperature; consume within 3 days."
  },
  {
    images: [teacake],
    name: "Vanilla Teacake",
    isVeg: false,
    weight: "400 GM",
    type: ["new", "teacake"],
    description: "Delicate vanilla flavored teacake with a moist texture.",
    ingredients: "Flour, sugar, eggs, butter, vanilla extract, baking powder.",
    delivery_instructions: "Keep refrigerated; best if consumed within 4 days."
  },
  {
    images: [chocolateFudgeBrownie],
    name: "Walnut Brownie",
    isVeg: false,
    weight: "600 GM",
    type: ["classic","new", "brownie"],
    description: "Rich chocolate brownie loaded with crunchy walnuts.",
    ingredients: "Cocoa powder, walnuts, sugar, butter, eggs, flour.",
    delivery_instructions: "Store in airtight container; consume within 5 days."
  },
  {
    images: [muffin],
    name: "Healthy Granola Bars",
    isVeg: false,
    weight: "800 GM",
    type: ["healthy", "brownie"],
    description: "Oats and nuts packed granola bars for a healthy snack.",
    ingredients: "Oats, honey, almonds, peanuts, flax seeds, coconut oil.",
    delivery_instructions: "Keep in cool dry place; best before 10 days."
  }
];




