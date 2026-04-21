"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './carousel.module.css';

const IMAGES = [
  "https://picsum.photos/id/10/800/450",
  "https://picsum.photos/id/20/800/450",
  "https://picsum.photos/id/30/800/450",
  "https://picsum.photos/id/40/800/450",
  "https://picsum.photos/id/50/800/450",
];

export default function CarouselExample() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % IMAGES.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + IMAGES.length) % IMAGES.length);
  };

  // Animation variants for the "shrink and disappear" effect
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.5, // This creates the "shrink" effect
    }),
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ejemplo de Carrusel Infinito</h1>

      <div className={styles.carouselWrapper}>
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.3 }
            }}
            className={styles.slide}
          >
            <img 
              src={IMAGES[currentIndex]} 
              alt={`Slide ${currentIndex}`} 
              className={styles.image} 
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.controls}>
        <button className={`${styles.button} ${styles.buttonPrev}`} onClick={prevSlide}>
          Anterior
        </button>
        <button className={`${styles.button} ${styles.buttonNext}`} onClick={nextSlide}>
          Siguiente
        </button>
      </div>

      <div className={styles.indicatorContainer}>
        {IMAGES.map((_, index) => (
          <div 
            key={index} 
            className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`} 
          />
        ))}
      </div>
    </div>
  );
}
