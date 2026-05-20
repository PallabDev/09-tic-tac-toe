import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    hashedRefreshToken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function savePassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = function isPasswordCorrect(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);
