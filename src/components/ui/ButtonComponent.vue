<template>
  <button
    v-bind="$attrs"
    :disabled="disabled"
    :class="[
      // base
      'group relative overflow-hidden rounded font-semibold transition-all duration-200 ease-linear focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
      sizeClasses,
      variantClasses,
      focusClasses,
      // only add hover/active + group when interactive
      !disabled && 'group cursor-pointer active:scale-95',
    ]"
  >
    <!-- Background slide animation -->
    <div
      v-if="showBackgroundSlide"
      class="absolute inset-0 transition-transform duration-300 ease-out"
      :class="backgroundSlideClasses"
    ></div>

    <!-- Arrow Icon (conditionally rendered) -->
    <div
      v-if="showIcon"
      class="absolute top-0 z-10 flex h-full items-center justify-center transition-opacity duration-200 ease-linear"
      :class="[
        arrowPositionClasses,
        // only reveal on hover when interactive
        !disabled ? 'opacity-0 group-hover:opacity-100' : 'opacity-0',
      ]"
    >
      <!-- Custom icon slot or default arrow -->
      <slot name="icon">
        <i :class="[arrowIconClasses, iconSizeClasses]"></i>
      </slot>
    </div>

    <!-- Button Text -->
    <span
      class="relative z-10 block transition-transform duration-200 ease-linear"
      :class="[textSpacingClasses, showIcon ? hoverTranslationClasses : '']"
    >
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  disabled?: boolean;
  size?: "small" | "medium" | "large";
  variant?: "primary" | "secondary";
  // New props for customization
  showIcon?: boolean;
  iconPosition?: "left" | "right" | "auto"; // 'auto' uses variant default
  showBackgroundSlide?: boolean;
  customColors?: {
    background?: string;
    text?: string;
    focusRing?: string;
    backgroundSlide?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  size: "medium",
  variant: "primary",
  showIcon: true,
  iconPosition: "auto",
  showBackgroundSlide: true,
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case "small":
      return "h-8 px-4 text-sm";
    case "large":
      return "h-12 px-8 text-xl";
    default:
      return "h-10 px-6 text-lg";
  }
});

const variantClasses = computed(() => {
  if (props.customColors) {
    return `${props.customColors.background || "bg-gray-500"} ${props.customColors.text || "text-white"}`;
  }

  return props.variant === "primary" ? "bg-orange-500 text-white" : "bg-transparent border border-black text-gray-700";
});

const focusClasses = computed(() => {
  if (props.customColors?.focusRing) {
    return `focus-visible:ring-4 ${props.customColors.focusRing}`;
  }

  return props.variant === "primary"
    ? "focus-visible:ring-4 focus-visible:ring-orange-500"
    : "focus-visible:ring-4 focus-visible:ring-gray-300";
});

const backgroundSlideClasses = computed(() => {
  const slideColor =
    props.customColors?.backgroundSlide || (props.variant === "primary" ? "bg-orange-600" : "bg-base-2");

  const iconPos = props.iconPosition === "auto" ? (props.variant === "primary" ? "right" : "left") : props.iconPosition;

  const slideDirection = iconPos === "right" ? "-translate-x-full" : "translate-x-full";

  return props.disabled
    ? `${slideColor} transform ${slideDirection}` // frozen off-canvas
    : `${slideColor} transform ${slideDirection} group-hover:translate-x-0`;
});

const textSpacingClasses = computed(() => {
  switch (props.size) {
    case "small":
      return "px-1";
    case "large":
      return "px-3";
    default:
      return "px-2";
  }
});

const hoverTranslationClasses = computed(() => {
  if (props.disabled) return "";

  const iconPos = props.iconPosition === "auto" ? (props.variant === "primary" ? "right" : "left") : props.iconPosition;

  const direction = iconPos === "right" ? "-translate-x" : "translate-x";
  console.log("direction", direction);

  switch (props.size) {
    case "small":
      return `group-hover:${direction}-2`;
    case "large":
      return `group-hover:${direction}-4`;
    default:
      return `group-hover:${direction}-3`;
  }
});

const arrowPositionClasses = computed(() => {
  const iconPos = props.iconPosition === "auto" ? (props.variant === "primary" ? "right" : "left") : props.iconPosition;

  if (iconPos === "right") {
    switch (props.size) {
      case "small":
        return "right-2 w-4";
      case "large":
        return "right-6 w-8";
      default:
        return "right-4 w-6";
    }
  } else {
    switch (props.size) {
      case "small":
        return "left-2 w-4";
      case "large":
        return "left-6 w-8";
      default:
        return "left-4 w-6";
    }
  }
});

const arrowIconClasses = computed(() => {
  const iconPos = props.iconPosition === "auto" ? (props.variant === "primary" ? "right" : "left") : props.iconPosition;

  const direction = iconPos === "right" ? "pi-arrow-right" : "pi-arrow-left";
  const color = props.variant === "primary" ? "text-white" : "text-gray-700";
  return `pi ${direction} ${color}`;
});

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case "small":
      return "text-xs";
    case "large":
      return "text-lg";
    default:
      return "text-sm";
  }
});
</script>
