// Every fixed position in the world, in one place, so props and scenes agree.
// The world is a Mercator map (see geo.js): +x is east, -z is north, ~10 units per degree.
// Each port's layout is written relative to its berth, the spot the ship's centre docks at.
import { lonToX, latToZ, project } from './geo.js';

export const WATER_Y = -1;
export const QUAY_Y = .05;

// Berths: the ship docks broadside, heading east, just south of a straight quay.
const usQuay = latToZ(28.0), ukQuay = latToZ(50.2);
export const US_BERTH = [lonToX(-80.475) + 22, usQuay + 4.8];   // off Florida's Atlantic coast
export const UK_BERTH = [lonToX(-3.4), ukQuay + 4.8];           // England's south coast

const at = ([bx, bz], dx, dz) => [bx + dx, bz + dz];
export const us = (dx, dz) => at(US_BERTH, dx, dz);
export const uk = (dx, dz) => at(UK_BERTH, dx, dz);

// The ship's route: straight off one berth, across the Atlantic and up the Channel to the other.
export const SHIP = {
  route: [US_BERTH, us(12, 0), project([-77, 29.5]), project([-70, 32.5]), project([-55, 38]), project([-40, 42.5]), project([-25, 46]), project([-14, 48.5]), project([-7.5, 49.5]), uk(-16, 0), UK_BERTH],
  slotLocal: [-2.5, 5.2, 0],
};

export const US = {
  pad: { x0: US_BERTH[0] - 30, x1: US_BERTH[0] + 24, z0: usQuay - 16, z1: usQuay },   // concrete terminal
  crane: us(-2.5, -10.55),
  containerOnQuay: us(-2.5, -10.8),
  containerDoor: us(-5.6, -10.8),
  pallet: us(-13, -10.8),
  packhouse: us(-32, -25),
  grove: { x0: US_BERTH[0] - 62, z0: US_BERTH[1] - 50, cols: 3, rows: 3, gap: 7 },
  flag: us(16, -14),
};

const ROAD_X = 12;   // the UK road north from the port, relative to the berth
export const UK = {
  pad: { x0: UK_BERTH[0] - 22, x1: UK_BERTH[0] + 18, z0: ukQuay - 10, z1: ukQuay },
  crane: uk(-2.5, -10.55),
  roadX: UK_BERTH[0] + ROAD_X,
  roads: [
    { x: uk(4.75, 0)[0], z: uk(0, -10.8)[1], w: 17.5, d: 3 },        // along the quay
    { x: uk(ROAD_X, 0)[0], z: uk(0, -26.8)[1], w: 3, d: 35 },         // north to the office
  ],
  checkpoint: { roadX: UK_BERTH[0] + ROAD_X, barrierZ: uk(0, -21.8)[1], boothX: uk(ROAD_X + 5.5, 0)[0], gantryZ: uk(0, -25.8)[1] },
  truckRoute: [uk(-1.7, -10.8), uk(6, -10.8), uk(8, -11.3), uk(ROAD_X, -15.8), uk(ROAD_X, -24.8), uk(ROAD_X, -32.8), uk(ROAD_X + .5, -42.3)],
  truckStopZ: uk(0, -16)[1],   // cab nose just short of the barrier
  sample: uk(ROAD_X + 3.2, -13.3),
  crateOut: uk(ROAD_X + .5, -36.9),
  meet: uk(ROAD_X + 2.2, -36.7),
  flag: uk(-14, -14),
};

export const OFFICE = {
  origin: (([x, z]) => [x, 0, z])(uk(ROAD_X + 13, -43.3)),
  seat: [0, -2.12],            // local, she faces -z (the back wall) when seated
  stand: [-.9, -1.4],          // local spot by the desk, used in scene 1
  door: [-5.2, 1.2],           // local, just outside the open side
};
