/* ============================================================================
 *  chapters.js — a life, told as visits.
 *
 *  Each chapter is one afternoon on the hill: a season, an hour, a weather,
 *  who came, and a handful of beats that play out on their own.  Nothing is
 *  narrated.  You watch it happen, and you can wander off and look at the
 *  grass instead if you want to.
 * ==========================================================================*/

import { PLACES, ARRIVE_X, EXIT_X } from './world.js';

/* eras:  0 verdant  1 dry/hazy  2 cool-misty  3 blossom  4 pea-fields  5 late
   times: 0 dawn  1 morning  2 noon  3 afternoon  4 dusk  5 night          */

const A = 'A', B = 'B', C = 'C';

/** A step: {t} seconds from the chapter start, then whatever else it says. */
export const CHAPTERS = [
  /* ---------------------------------------------------- year one, a puppy */
  {
    id: 'found', year: 0, era: 0, tod: 1, weather: 'clear', dogAge: 0,
    dogAt: PLACES.pond.x + 96, minTime: 40, intro: true,
    title: 'the first afternoon',
    cast: [],
    script: [],
  },
  {
    id: 'firstvisit', year: 0, era: 0, tod: 3, weather: 'clear', dogAge: 0,
    dogAt: PLACES.log.x - 20, minTime: 95,
    cast: [{ who: A, outfit: 'uniformA', age: 0, from: ARRIVE_X }],
    script: [
      { t: 1, who: A, walk: PLACES.log.x - 26, prop: 'bag' },
      { t: 12, who: A, pose: 'sit_ground', face: 'calm', prop: 'book', flip: false },
      { t: 20, dogTo: PLACES.log.x - 14, why: 'come' },
      { t: 26, who: A, face: 'surprise', pose: 'sit_ground' },
      { t: 32, who: A, face: 'smile', feed: true },
      { t: 40, dogPose: 'eat' },
      { t: 52, who: A, pose: 'sit_ground', face: 'smile', prop: 'book' },
      { t: 78, who: A, pose: 'stand', prop: 'bag' },
      { t: 84, who: A, walk: ARRIVE_X, face: 'smile' },
    ],
  },
  {
    id: 'rainday', year: 0, era: 0, tod: 3, weather: 'rain', dogAge: 0,
    dogAt: PLACES.log.x, minTime: 90,
    cast: [{ who: A, outfit: 'uniformA', age: 0, from: ARRIVE_X, prop: 'umbrella' }],
    script: [
      { t: 1, who: A, walk: PLACES.log.x - 18, pose: 'umbrella', prop: 'umbrella' },
      { t: 16, who: A, pose: 'crouch', face: 'smile', prop: null },
      { t: 24, dogTo: PLACES.log.x - 12, why: 'come' },
      { t: 34, who: A, pose: 'sit_log', face: 'smile', at: PLACES.log.x - 10 },
      { t: 70, who: A, pose: 'stand', prop: 'umbrella' },
      { t: 78, who: A, walk: ARRIVE_X, pose: 'umbrella' },
    ],
  },
  {
    id: 'stranger', year: 0, era: 1, tod: 3, weather: 'clear', dogAge: 1,
    dogAt: PLACES.view.x - 40, minTime: 105,
    cast: [
      { who: A, outfit: 'uniformA', age: 0, from: ARRIVE_X },
      { who: B, outfit: 'uniformB', age: 0, from: EXIT_X },
    ],
    script: [
      { t: 2, who: A, walk: PLACES.log.x - 24, prop: 'bag' },
      { t: 14, who: A, pose: 'sit_ground', prop: 'book', face: 'calm' },
      { t: 24, who: B, walk: PLACES.view.x + 20, prop: 'bag' },
      { t: 40, who: B, pose: 'sit_ground', prop: 'book', face: 'calm', flip: true },
      { t: 48, dogTo: PLACES.view.x + 10, why: 'come' },
      { t: 60, who: B, face: 'surprise' },
      { t: 66, who: B, pose: 'reach', face: 'smile' },
      { t: 76, who: A, face: 'calm', turn: -1 },
      { t: 86, who: B, pose: 'sit_ground', prop: 'book', face: 'smile' },
      { t: 96, who: A, walk: ARRIVE_X },
      { t: 100, who: B, walk: EXIT_X },
    ],
  },
  {
    id: 'together1', year: 1, era: 0, tod: 3, weather: 'clear', dogAge: 1,
    dogAt: PLACES.log.x + 10, minTime: 110,
    cast: [
      { who: A, outfit: 'blazerA', age: 0, from: ARRIVE_X },
      { who: B, outfit: 'blazerB', age: 0, from: 1240 },
    ],
    script: [
      { t: 2, who: A, walk: PLACES.log.x - 30, prop: 'bag' },
      { t: 12, who: A, pose: 'sit_ground', prop: 'book' },
      { t: 20, who: B, walk: PLACES.log.x + 26, prop: 'bag' },
      { t: 34, who: B, pose: 'sit_ground', prop: 'book', flip: true, face: 'calm' },
      { t: 46, who: A, face: 'smile' },
      { t: 52, who: B, face: 'smile' },
      { t: 60, dogTo: PLACES.log.x, why: 'come' },
      { t: 64, dogPose: 'lie' },
      { t: 84, who: A, face: 'laugh' },
      { t: 86, who: B, face: 'laugh' },
      { t: 98, who: A, pose: 'stand', prop: 'bag' },
      { t: 100, who: B, pose: 'stand', prop: 'bag' },
      { t: 104, who: A, walk: ARRIVE_X },
      { t: 106, who: B, walk: ARRIVE_X, speed: 22 },
    ],
  },
  {
    id: 'summer', year: 1, era: 1, tod: 2, weather: 'clear', dogAge: 1,
    dogAt: PLACES.pond.x, minTime: 110, plantBed: 0.15,
    cast: [
      { who: A, outfit: 'summerA', age: 0, from: ARRIVE_X },
      { who: B, outfit: 'summerB', age: 0, from: ARRIVE_X - 26 },
    ],
    script: [
      { t: 2, who: A, walk: PLACES.bed.x - 24 },
      { t: 4, who: B, walk: PLACES.bed.x + 22 },
      { t: 22, who: A, pose: 'crouch', face: 'smile' },
      { t: 26, who: B, pose: 'crouch', face: 'calm', flip: true },
      { t: 40, dogTo: PLACES.pond.x, why: 'play' },
      { t: 44, dogPose: 'run', splash: true },
      { t: 58, who: A, face: 'laugh' },
      { t: 60, who: B, face: 'laugh' },
      { t: 72, who: A, pose: 'stand' },
      { t: 74, who: B, pose: 'stand' },
      { t: 96, who: A, walk: ARRIVE_X },
      { t: 98, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'exams', year: 1, era: 2, tod: 3, weather: 'overcast', dogAge: 2,
    dogAt: PLACES.log.x - 6, minTime: 100,
    cast: [
      { who: A, outfit: 'blazerA', age: 0, from: ARRIVE_X },
      { who: B, outfit: 'blazerB', age: 0, from: ARRIVE_X - 24 },
    ],
    script: [
      { t: 2, who: A, walk: PLACES.log.x - 28, prop: 'bag' },
      { t: 4, who: B, walk: PLACES.log.x + 20, prop: 'bag' },
      { t: 18, who: A, pose: 'sit_ground', prop: 'book', face: 'tired' },
      { t: 20, who: B, pose: 'sit_ground', prop: 'book', face: 'tired', flip: true },
      { t: 40, dogPose: 'sleep' },
      { t: 64, who: A, face: 'closed' },
      { t: 86, who: A, pose: 'stand' }, { t: 88, who: B, pose: 'stand' },
      { t: 92, who: A, walk: ARRIVE_X }, { t: 94, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'lanterns', year: 1, era: 2, tod: 4, weather: 'clear', dogAge: 2,
    dogAt: PLACES.view.x - 20, minTime: 120, lanterns: true,
    cast: [
      { who: A, outfit: 'blazerA', age: 0, from: ARRIVE_X },
      { who: B, outfit: 'blazerB', age: 0, from: ARRIVE_X - 24 },
    ],
    script: [
      { t: 2, who: A, walk: PLACES.view.x - 16 },
      { t: 4, who: B, walk: PLACES.view.x + 14 },
      { t: 24, who: A, pose: 'stand', face: 'calm', turn: 1 },
      { t: 26, who: B, pose: 'stand', face: 'calm', flip: true },
      { t: 30, cam: PLACES.view.x },
      { t: 54, who: A, face: 'smile', blush: true },
      { t: 58, who: B, face: 'smile', blush: true },
      { t: 70, who: A, pose: 'hold', at: PLACES.view.x - 9 },
      { t: 70, who: B, pose: 'hold', at: PLACES.view.x + 7, flip: true },
      { t: 104, who: A, walk: ARRIVE_X }, { t: 106, who: B, walk: ARRIVE_X },
    ],
  },
  /* -------------------------------------------------- year three, a strain */
  {
    id: 'blossom', year: 2, era: 3, tod: 3, weather: 'petals', dogAge: 2,
    dogAt: PLACES.bigTree.x + 20, minTime: 110, plantBed: 0.5,
    cast: [
      { who: A, outfit: 'cardigan', age: 0, from: ARRIVE_X },
      { who: B, outfit: 'hoodie', age: 0, from: ARRIVE_X - 24 },
    ],
    script: [
      { t: 2, who: A, walk: PLACES.log.x - 14 },
      { t: 4, who: B, walk: PLACES.log.x + 12 },
      { t: 20, who: A, pose: 'sit_log', face: 'smile' },
      { t: 22, who: B, pose: 'sit_log', face: 'smile', flip: true },
      { t: 40, dogTo: PLACES.log.x - 2 }, { t: 46, dogPose: 'lie' },
      { t: 92, who: A, walk: ARRIVE_X }, { t: 94, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'argument', year: 2, era: 5, tod: 3, weather: 'wind', dogAge: 2,
    dogAt: PLACES.log.x, minTime: 95,
    cast: [
      { who: A, outfit: 'cardigan', age: 0, from: ARRIVE_X },
      { who: B, outfit: 'hoodie', age: 0, from: ARRIVE_X - 30 },
    ],
    script: [
      { t: 2, who: A, walk: PLACES.log.x - 20 },
      { t: 5, who: B, walk: PLACES.log.x + 30 },
      { t: 22, who: A, pose: 'arms_crossed', face: 'sad', flip: true },
      { t: 24, who: B, pose: 'pockets', face: 'sad' },
      { t: 34, cam: PLACES.log.x + 4 },
      { t: 40, who: B, pose: 'point', face: 'angry', flip: true },
      { t: 48, who: A, pose: 'arms_crossed', face: 'cry', flip: true },
      { t: 58, dogPose: 'sit' }, { t: 58, dogLook: 'between' },
      { t: 66, who: B, walk: EXIT_X, face: 'sad', speed: 34 },
      { t: 76, who: A, pose: 'stand', face: 'cry' },
      { t: 86, who: A, walk: ARRIVE_X, face: 'sad' },
    ],
  },
  {
    id: 'alone_a', year: 2, era: 5, tod: 4, weather: 'overcast', dogAge: 3,
    dogAt: PLACES.log.x - 8, minTime: 95,
    cast: [{ who: A, outfit: 'coatA', age: 1, from: ARRIVE_X }],
    script: [
      { t: 3, who: A, walk: PLACES.log.x - 12 },
      { t: 20, who: A, pose: 'sit_ground', face: 'sad' },
      { t: 30, dogTo: PLACES.log.x - 8 },
      { t: 40, dogPose: 'lie' }, { t: 40, dogLap: true },
      { t: 50, who: A, face: 'calm' },
      { t: 74, who: A, face: 'smile' },
      { t: 84, who: A, pose: 'stand' },
      { t: 88, who: A, walk: ARRIVE_X },
    ],
  },
  {
    id: 'alone_b', year: 3, era: 2, tod: 4, weather: 'mist', dogAge: 3,
    dogAt: PLACES.view.x, minTime: 90,
    cast: [{ who: B, outfit: 'coatB', age: 1, from: EXIT_X }],
    script: [
      { t: 3, who: B, walk: PLACES.view.x + 12, flip: true },
      { t: 22, who: B, pose: 'sit_ground', face: 'sad', flip: true },
      { t: 34, dogTo: PLACES.view.x + 4 }, { t: 40, dogPose: 'sit' },
      { t: 58, who: B, pose: 'reach', face: 'calm' },
      { t: 72, who: B, pose: 'stand', face: 'calm' },
      { t: 82, who: B, walk: EXIT_X },
    ],
  },
  {
    id: 'missed', year: 3, era: 2, tod: 1, weather: 'mist', dogAge: 3,
    dogAt: PLACES.rocks.x - 20, minTime: 100,
    cast: [
      { who: A, outfit: 'coatA', age: 1, from: ARRIVE_X },
      { who: B, outfit: 'coatB', age: 1, from: EXIT_X },
    ],
    script: [
      { t: 4, who: A, walk: PLACES.log.x - 10 },
      { t: 22, who: A, pose: 'sit_log', face: 'calm' },
      { t: 48, who: A, pose: 'stand' },
      { t: 54, who: A, walk: ARRIVE_X },
      { t: 64, who: B, walk: PLACES.log.x + 8, flip: true },
      { t: 78, who: B, pose: 'sit_log', face: 'sad' },
      { t: 92, who: B, pose: 'stand' },
      { t: 96, who: B, walk: EXIT_X },
    ],
  },
  {
    id: 'again', year: 3, era: 0, tod: 3, weather: 'clear', dogAge: 3, minTime: 120,
    dogAt: PLACES.steps.x + 40,
    cast: [
      { who: A, outfit: 'cardigan', age: 1, from: ARRIVE_X },
      { who: B, outfit: 'hoodie', age: 1, from: 1240 },
    ],
    script: [
      { t: 3, who: A, walk: PLACES.log.x - 40 },
      { t: 16, who: B, walk: PLACES.log.x + 40, flip: true },
      { t: 30, who: A, pose: 'stand', face: 'surprise' },
      { t: 32, who: B, pose: 'stand', face: 'surprise', flip: true },
      { t: 46, dogTo: PLACES.log.x, why: 'come' },
      { t: 56, who: A, walk: PLACES.log.x - 16, face: 'calm' },
      { t: 58, who: B, walk: PLACES.log.x + 14, face: 'calm' },
      { t: 74, who: A, pose: 'sit_log', face: 'calm' },
      { t: 76, who: B, pose: 'sit_log', face: 'calm', flip: true },
      { t: 96, who: A, face: 'smile' }, { t: 100, who: B, face: 'smile' },
      { t: 112, who: A, walk: ARRIVE_X }, { t: 114, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'graduation', year: 3, era: 3, tod: 3, weather: 'petals', dogAge: 3,
    dogAt: PLACES.log.x + 6, minTime: 120, plantBed: 0.85,
    cast: [
      { who: A, outfit: 'blazerA', age: 1, from: ARRIVE_X },
      { who: B, outfit: 'blazerB', age: 1, from: ARRIVE_X - 26 },
    ],
    script: [
      { t: 3, who: A, walk: PLACES.log.x - 18 },
      { t: 5, who: B, walk: PLACES.log.x + 16 },
      { t: 26, who: A, pose: 'crouch', face: 'smile' },
      { t: 30, dogTo: PLACES.log.x - 14, why: 'come' },
      { t: 44, who: B, pose: 'crouch', face: 'smile', flip: true },
      { t: 68, who: A, pose: 'stand' }, { t: 70, who: B, pose: 'stand' },
      { t: 80, who: A, pose: 'hold', at: PLACES.log.x - 7 },
      { t: 80, who: B, pose: 'hold', at: PLACES.log.x + 9, flip: true },
      { t: 104, who: A, walk: ARRIVE_X }, { t: 104, who: B, walk: ARRIVE_X, speed: 24 },
      { t: 108, dogPose: 'sit' }, { t: 108, dogLook: 'away' },
    ],
  },
  /* ------------------------------------------------ the years after school */
  {
    id: 'return1', year: 5, era: 1, tod: 3, weather: 'clear', dogAge: 3, minTime: 110,
    dogAt: PLACES.bed.x - 20, plantBed: 0.6,
    cast: [
      { who: A, outfit: 'adultA', age: 1, from: ARRIVE_X },
      { who: B, outfit: 'adultB', age: 1, from: ARRIVE_X - 24 },
    ],
    script: [
      { t: 3, who: A, walk: PLACES.bed.x - 26 },
      { t: 5, who: B, walk: PLACES.bed.x + 20 },
      { t: 24, who: A, pose: 'crouch', face: 'calm' },
      { t: 28, who: B, pose: 'crouch', face: 'calm', flip: true },
      { t: 54, who: A, pose: 'stand', face: 'smile' },
      { t: 58, who: B, pose: 'stand', face: 'smile' },
      { t: 96, who: A, walk: ARRIVE_X }, { t: 98, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'apart', year: 6, era: 5, tod: 4, weather: 'wind', dogAge: 3, minTime: 90,
    dogAt: PLACES.steps.x + 30,
    cast: [],
    script: [
      { t: 10, dogTo: PLACES.steps.x + 10, why: 'wait' },
      { t: 30, dogPose: 'sit' }, { t: 30, dogLook: 'away' },
      { t: 64, dogPose: 'lie' },
    ],
  },
  {
    id: 'return2', year: 7, era: 0, tod: 1, weather: 'clear', dogAge: 3, minTime: 120,
    dogAt: PLACES.log.x,
    cast: [
      { who: B, outfit: 'adultB', age: 2, from: EXIT_X },
      { who: A, outfit: 'adultA', age: 2, from: ARRIVE_X },
    ],
    script: [
      { t: 4, who: B, walk: PLACES.log.x + 20, flip: true },
      { t: 24, who: B, pose: 'sit_log', face: 'calm', flip: true },
      { t: 40, dogTo: PLACES.log.x + 12 },
      { t: 56, who: A, walk: PLACES.log.x - 20 },
      { t: 72, who: B, pose: 'stand', face: 'surprise', flip: true },
      { t: 80, who: A, pose: 'stand', face: 'smile' },
      { t: 92, who: A, pose: 'hug', at: PLACES.log.x - 5 },
      { t: 92, who: B, pose: 'hug', at: PLACES.log.x + 5, flip: true },
      { t: 112, who: A, walk: ARRIVE_X }, { t: 112, who: B, walk: ARRIVE_X, speed: 24 },
    ],
  },
  {
    id: 'slowing', year: 9, era: 2, tod: 3, weather: 'overcast', dogAge: 4, minTime: 120,
    dogAt: PLACES.rocks.x - 30,
    cast: [
      { who: A, outfit: 'adultA', age: 2, from: ARRIVE_X, hair: 'bun' },
      { who: B, outfit: 'adultB', age: 2, from: ARRIVE_X - 24 },
    ],
    script: [
      { t: 3, who: A, walk: PLACES.rocks.x - 36 },
      { t: 6, who: B, walk: PLACES.rocks.x - 8 },
      { t: 26, who: A, pose: 'sit_knees', face: 'smile' },
      { t: 30, who: B, pose: 'crouch', face: 'calm', flip: true },
      { t: 40, dogPose: 'lie' },
      { t: 60, who: A, pose: 'reach', face: 'smile' },
      { t: 100, who: A, pose: 'stand' }, { t: 102, who: B, pose: 'stand' },
      { t: 110, who: A, walk: ARRIVE_X }, { t: 112, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'lastday', year: 10, era: 3, tod: 4, weather: 'still', dogAge: 4, minTime: 170,
    dogAt: PLACES.rocks.x - 6, death: true,
    cast: [
      { who: A, outfit: 'adultA', age: 2, from: ARRIVE_X, hair: 'bun' },
      { who: B, outfit: 'adultB', age: 2, from: ARRIVE_X - 26 },
    ],
    script: [
      { t: 4, who: A, walk: PLACES.rocks.x - 24, speed: 20 },
      { t: 8, who: B, walk: PLACES.rocks.x + 16, speed: 20 },
      { t: 30, who: A, pose: 'sit_knees', face: 'calm' },
      { t: 34, who: B, pose: 'sit_knees', face: 'calm', flip: true },
      { t: 40, cam: PLACES.rocks.x - 6, hold: true },
      { t: 46, dogPose: 'lie' },
      { t: 70, dogPose: 'sleep' },
      { t: 96, who: A, pose: 'reach', face: 'smile' },
      { t: 130, dogFade: true },
      { t: 136, who: A, face: 'cry' },
      { t: 140, who: B, face: 'sad' },
    ],
  },
  {
    id: 'burial', year: 10, era: 5, tod: 3, weather: 'rain', dogAge: 4, minTime: 140,
    grave: 0, sapling: 0.04, noDog: true,
    cast: [
      { who: A, outfit: 'coatA', age: 2, from: ARRIVE_X, hair: 'bun' },
      { who: B, outfit: 'coatB', age: 2, from: ARRIVE_X - 26 },
    ],
    script: [
      { t: 4, who: A, walk: PLACES.grave.x - 18, speed: 18 },
      { t: 8, who: B, walk: PLACES.grave.x + 14, speed: 18 },
      { t: 30, who: B, pose: 'crouch', face: 'sad', flip: true },
      { t: 34, who: A, pose: 'sit_knees', face: 'cry' },
      { t: 50, cam: PLACES.grave.x, hold: true },
      { t: 90, who: A, pose: 'stand', face: 'sad' },
      { t: 94, who: B, pose: 'stand', face: 'sad' },
      { t: 104, who: A, pose: 'hold', at: PLACES.grave.x - 7 },
      { t: 104, who: B, pose: 'hold', at: PLACES.grave.x + 9, flip: true },
      { t: 128, who: A, walk: ARRIVE_X }, { t: 128, who: B, walk: ARRIVE_X, speed: 20 },
    ],
  },
  /* ------------------------------------------------ the tree over the years */
  {
    id: 'after1', year: 11, era: 0, tod: 3, weather: 'clear', dogAge: 4, minTime: 100,
    grave: 0.25, sapling: 0.18, noDog: true, offering: 2,
    cast: [
      { who: A, outfit: 'adultA', age: 2, from: ARRIVE_X, hair: 'bun' },
      { who: B, outfit: 'adultB', age: 2, from: ARRIVE_X - 24 },
    ],
    script: [
      { t: 4, who: A, walk: PLACES.grave.x - 16 },
      { t: 7, who: B, walk: PLACES.grave.x + 12 },
      { t: 26, who: A, pose: 'crouch', face: 'calm' },
      { t: 46, who: A, pose: 'stand', face: 'smile' },
      { t: 84, who: A, walk: ARRIVE_X }, { t: 86, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'after2', year: 14, era: 1, tod: 4, weather: 'clear', dogAge: 4, minTime: 100,
    grave: 0.6, sapling: 0.45, noDog: true, offering: 3,
    cast: [
      { who: A, outfit: 'adultA', age: 2, from: ARRIVE_X, hair: 'bun' },
      { who: B, outfit: 'adultB', age: 2, from: ARRIVE_X - 24 },
    ],
    script: [
      { t: 4, who: A, walk: PLACES.grave.x - 14 },
      { t: 7, who: B, walk: PLACES.grave.x + 12 },
      { t: 30, who: A, pose: 'hold', at: PLACES.grave.x - 7 },
      { t: 30, who: B, pose: 'hold', at: PLACES.grave.x + 9, flip: true },
      { t: 84, who: A, walk: ARRIVE_X }, { t: 86, who: B, walk: ARRIVE_X },
    ],
  },
  {
    id: 'family', year: 19, era: 0, tod: 3, weather: 'clear', dogAge: 4, minTime: 130,
    grave: 1, sapling: 0.78, noDog: true, offering: 4,
    cast: [
      { who: A, outfit: 'adultA', age: 2, from: ARRIVE_X, hair: 'bun' },
      { who: B, outfit: 'adultB', age: 2, from: ARRIVE_X - 22 },
      { who: C, outfit: 'child', age: 0, from: ARRIVE_X - 40 },
    ],
    script: [
      { t: 4, who: A, walk: PLACES.grave.x - 22, speed: 20 },
      { t: 6, who: B, walk: PLACES.grave.x + 18, speed: 20 },
      { t: 8, who: C, walk: PLACES.grave.x - 4, speed: 34 },
      { t: 34, who: C, pose: 'crouch', face: 'laugh' },
      { t: 44, who: A, pose: 'crouch', face: 'smile' },
      { t: 70, who: C, pose: 'stand', face: 'laugh' },
      { t: 78, who: A, pose: 'stand', face: 'smile' },
      { t: 96, who: C, walk: PLACES.view.x, speed: 40 },
      { t: 104, who: A, walk: PLACES.view.x - 24, speed: 22 },
      { t: 106, who: B, walk: PLACES.view.x + 20, speed: 22 },
    ],
  },
  {
    id: 'bloom', year: 26, era: 4, tod: 4, weather: 'still', dogAge: 4, minTime: 150,
    grave: 1, sapling: 1, noDog: true, offering: 5, bloom: true, ending: true,
    cast: [
      { who: A, outfit: 'adultA', age: 2, from: ARRIVE_X, hair: 'bun' },
      { who: B, outfit: 'adultB', age: 2, from: ARRIVE_X - 22 },
    ],
    script: [
      { t: 6, who: A, walk: PLACES.grave.x - 26, speed: 18 },
      { t: 9, who: B, walk: PLACES.grave.x + 22, speed: 18 },
      { t: 40, cam: PLACES.grave.x, hold: true },
      { t: 56, who: A, pose: 'stand', face: 'smile', turn: 1 },
      { t: 60, who: B, pose: 'stand', face: 'smile', flip: true },
      { t: 80, who: A, pose: 'hold', at: PLACES.grave.x - 9 },
      { t: 80, who: B, pose: 'hold', at: PLACES.grave.x + 11, flip: true },
      { t: 100, bloomNow: true },
    ],
  },
];

/* -------------------------------------------------------------- the runner */

export class Director {
  constructor(game) {
    this.g = game;
    this.index = 0;
    this.t = 0;
    this.done = new Set();
    this.ending = false;
  }
  get chapter() { return CHAPTERS[Math.min(this.index, CHAPTERS.length - 1)]; }

  begin(i) {
    this.index = i;
    this.t = 0;
    this.done.clear();
    this.g.onChapterStart(this.chapter);
  }
  /** Is everything scripted finished, and has the minimum settled time passed? */
  get finished() {
    const c = this.chapter;
    const last = c.script.length ? c.script[c.script.length - 1].t : 0;
    return this.t > Math.max(c.minTime, last + 14);
  }
  update(dt) {
    this.t += dt;
    const c = this.chapter;
    for (let i = 0; i < c.script.length; i++) {
      if (this.done.has(i)) continue;
      if (this.t >= c.script[i].t) {
        this.done.add(i);
        this.g.applyStep(c.script[i], c);
      }
    }
  }
}
