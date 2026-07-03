import * as React from "react";
import { motion, useReducedMotion, type Variants, type HTMLMotionProps } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

type Direction = "up" | "left" | "right" | "scale" | "blur";

function variantsFor(direction: Direction): Variants {
  switch (direction) {
    case "left":
      return {
        hidden: { opacity: 0, x: -28 },
        show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
      };
    case "right":
      return {
        hidden: { opacity: 0, x: 28 },
        show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } },
      };
    case "scale":
      return {
        hidden: { opacity: 0, scale: 0.94 },
        show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE } },
      };
    case "blur":
      return {
        hidden: { opacity: 0, filter: "blur(8px)", y: 10 },
        show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: EASE } },
      };
    default:
      return {
        hidden: { opacity: 0, y: 18 },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
      };
  }
}

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.03 } },
};

interface RevealProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "whileInView" | "viewport" | "children"> {
  direction?: Direction;
  delay?: number;
  once?: boolean;
  children?: React.ReactNode;
}

/** Scroll-triggered reveal for landing-page sections. Respects prefers-reduced-motion. */
export function Reveal({ direction = "up", delay = 0, once = true, transition, children, ...props }: RevealProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-10% 0px" }}
      variants={variantsFor(direction)}
      transition={{ delay, ...transition }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface RevealGroupProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "whileInView" | "viewport" | "children"> {
  once?: boolean;
  children?: React.ReactNode;
}

export function RevealGroup({ once = true, children, ...props }: RevealGroupProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-10% 0px" }}
      variants={staggerContainer}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({
  className,
  children,
  direction = "up",
  ...props
}: Omit<HTMLMotionProps<"div">, "children" | "variants"> & { children?: React.ReactNode; direction?: Direction }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div variants={variantsFor(direction)} className={className} {...props}>
      {children}
    </motion.div>
  );
}
