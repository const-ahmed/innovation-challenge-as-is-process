// Named camera framings. `span` is how many world units fit across the view;
// `sx`/`sy` put the target off-centre (e.g. to make room for the form panel).
// Port and office shots are written relative to the berths and the office, so they follow the map.
import { US_BERTH, UK_BERTH, OFFICE } from './places.js';

const near = ([bx, bz], dx, y, dz) => [bx + dx, y, bz + dz];
const office = (dx, y, dz) => [OFFICE.origin[0] + dx, y, OFFICE.origin[2] + dz];
const mid = [(US_BERTH[0] + UK_BERTH[0]) / 2, 0, (US_BERTH[1] + UK_BERTH[1]) / 2];

export const CAM = {
  officeIntro: { target: office(-.8, 1.05, .1), span: 6.5, azimuth: -.42, elevation: .46, sx: .5, sy: .56 },
  office: { target: office(-.4, 1.3, -.9), span: 11, azimuth: -.5, elevation: .58, sx: .5, sy: .55 },
  officePace: { target: office(-1, 1.1, -.3), span: 9, azimuth: -.38, elevation: .5, sx: .5, sy: .55 },
  shoulder: { target: office(.05, 1.0, -2.6), span: 3.4, azimuth: .42, elevation: .5, sx: .33, sy: .55 },
  shoulderWide: { target: office(-.25, 1.2, -2.1), span: 4.2, azimuth: -.3, elevation: .38, sx: .36, sy: .55 },

  world: { target: [mid[0] + 60, 0, mid[2] + 40], span: 1500, azimuth: -.2, elevation: 1.05, sx: .5, sy: .5 },   // the whole map
  atlantic: { target: [mid[0], 0, mid[2] + 10], span: 900, azimuth: -.12, elevation: 1.1, sx: .5, sy: .52 },    // the crossing
  ship: { span: 78, azimuth: -.45, elevation: .6, sx: .5, sy: .55 },

  usPort: { target: near(US_BERTH, -9, 1.5, -13.3), span: 40, azimuth: -.35, elevation: 1.0, sx: .5, sy: .55 },
  usLoad: { target: near(US_BERTH, -4, 5, -5.8), span: 48, azimuth: -.5, elevation: .78, sx: .5, sy: .56 },
  ukPort: { target: near(UK_BERTH, 4, 4, -6.8), span: 50, azimuth: -.45, elevation: .78, sx: .5, sy: .55 },
  checkpoint: { target: near(UK_BERTH, 12.5, 2.2, -18.5), span: 28, azimuth: .55, elevation: .52, sx: .5, sy: .55 },
  delivery: { target: near(UK_BERTH, 13.4, 1.1, -38.4), span: 12.5, azimuth: -.42, elevation: .78, sx: .5, sy: .56 },
};
