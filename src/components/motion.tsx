import * as React from "react";
import { motion, useReducedMotion, type Variants, type HTMLMotionProps } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

interface FadeInProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "whileInView" | "viewport" | "children"> {
  delay?: number;
  once?: boolean;
  children?: React.ReactNode;
}

/** Fades + lifts content into place once it scrolls into view. Respects prefers-reduced-motion. */
export function FadeIn({ delay = 0, once = true, transition, children, ...props }: FadeInProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      variants={fadeUpVariants}
      transition={{ delay, duration: 0.5, ease: EASE, ...transition }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "whileInView" | "viewport" | "children"> {
  once?: boolean;
  children?: React.ReactNode;
}

/** Wrap a list of <StaggerItem> children to reveal them one after another. */
export function Stagger({ once = true, children, ...props }: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-80px" }}
      variants={staggerContainerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  className,
  children,
  ...props
}: Omit<HTMLMotionProps<"div">, "children"> & { children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div variants={fadeUpVariants} className={className} {...props}>
      {children}
    </motion.div>
  );
}
