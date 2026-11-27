import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CURATED_PROJECTS,
  CURATED_SERVICES,
  CURATED_SKILLS,
  CURATED_TEAM_MEMBERS,
} from '../data/showcaseDefaults';
import {
  getCategoryLabel,
  SERVICE_CATEGORIES,
  UI_COPY,
} from '../data/i18n';
import { ALGERIA_WILAYAS } from '../data/algeriaLocations';
import { parseTagInput } from '../components/ProjectManagerDrawer';
import { ADMIN_EMAIL, matchesCategoryFilter } from '../App';

describe('DZ Darkom Pro — Official Team Integrity & Data Validation', () => {
  it('contains zero fake team members or fake completed projects in defaults', () => {
    expect(CURATED_TEAM_MEMBERS).toEqual([]);
    expect(CURATED_PROJECTS).toEqual([]);
  });

  it('provides complete bilingual copy and 9 official service categories', () => {
    expect(SERVICE_CATEGORIES.length).toBe(9);
    for (const cat of SERVICE_CATEGORIES) {
      expect(cat.ar.trim().length).toBeGreaterThan(2);
      expect(cat.fr.trim().length).toBeGreaterThan(2);
      expect(cat.descAr.trim().length).toBeGreaterThan(10);
      expect(cat.descFr.trim().length).toBeGreaterThan(10);
      expect(getCategoryLabel(cat.id, 'ar')).toBe(cat.ar);
      expect(getCategoryLabel(cat.id, 'fr')).toBe(cat.fr);
    }
    expect(UI_COPY.ar.brand).toContain('dz darkom pro');
    expect(UI_COPY.fr.brand).toContain('dz darkom pro');
  });

  it('validates technical skill templates against Firestore blueprint limits', () => {
    expect(CURATED_SKILLS.length).toBeGreaterThanOrEqual(8);
    for (const sk of CURATED_SKILLS) {
      expect(sk.nameAr.length).toBeGreaterThanOrEqual(2);
      expect(sk.nameAr.length).toBeLessThanOrEqual(100);
      expect(sk.nameFr.length).toBeGreaterThanOrEqual(2);
      expect(sk.nameFr.length).toBeLessThanOrEqual(100);
      expect(sk.summaryAr.length).toBeGreaterThanOrEqual(5);
      expect(sk.summaryAr.length).toBeLessThanOrEqual(450);
      expect(sk.toolsAr.length).toBeLessThanOrEqual(220);
      expect((sk.toolsFr || '').length).toBeGreaterThan(5);
      expect((sk.tasksAr || '').split('\n').length).toBeGreaterThanOrEqual(3);
      expect((sk.tasksFr || '').split('\n').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('validates detailed service guide templates cover all 6 required dimensions', () => {
    expect(CURATED_SERVICES.length).toBeGreaterThanOrEqual(5);
    for (const srv of CURATED_SERVICES) {
      expect(srv.titleAr.length).toBeGreaterThanOrEqual(3);
      expect(srv.natureAr.length).toBeGreaterThanOrEqual(5);
      expect(srv.deliverablesAr.length).toBeGreaterThanOrEqual(5);
      expect(srv.stagesAr.length).toBeGreaterThanOrEqual(5);
      expect((srv.materialsToolsAr || '').length).toBeGreaterThanOrEqual(10);
      expect((srv.qualityStandardsAr || '').length).toBeGreaterThanOrEqual(10);
      expect(srv.outcomeAr.length).toBeGreaterThanOrEqual(5);
      expect(srv.durationLabel.length).toBeLessThanOrEqual(60);
    }
  });

  it('covers all 58 Algerian wilayas with communes', () => {
    expect(ALGERIA_WILAYAS.length).toBe(58);
    for (const w of ALGERIA_WILAYAS) {
      expect(w.ar.trim().length).toBeGreaterThan(1);
      expect(w.fr.trim().length).toBeGreaterThan(1);
      expect(w.communes.length).toBeGreaterThan(0);
    }
  });

  it('enforces tag input bounds (max 12 tags, max 80 chars each) matching Firestore rules', () => {
    const longTag = 'x'.repeat(120);
    const input = Array.from({ length: 16 }, (_, i) =>
      i === 0 ? longTag : `tag-${i}`
    ).join('، ');
    const parsed = parseTagInput(input);
    expect(parsed.length).toBe(12);
    expect(parsed[0].length).toBe(80);
  });

  it('matches legacy and current project categories accurately', () => {
    expect(matchesCategoryFilter('ceramics', 'all')).toBe(true);
    expect(matchesCategoryFilter('kitchen_bath', 'ceramics')).toBe(true);
    expect(
      matchesCategoryFilter('renovation', 'construction_renovation')
    ).toBe(true);
    expect(matchesCategoryFilter('welding', 'ceramics')).toBe(false);
  });

  it('enforces exclusive Admin write rules in firestore.rules and storage.rules', () => {
    const rootDir = process.cwd();
    const fsRules = fs.readFileSync(
      path.join(rootDir, 'firestore.rules'),
      'utf8'
    );
    const stRules = fs.readFileSync(
      path.join(rootDir, 'storage.rules'),
      'utf8'
    );

    expect(fsRules).toContain(ADMIN_EMAIL);
    expect(fsRules).toContain('match /skills/{skillId}');
    expect(fsRules).toContain('match /services/{serviceId}');
    expect(fsRules).toContain('match /projects/{projectId}');
    expect(fsRules).toContain('match /artisans/{artisanId}');
    expect(fsRules).toContain("incoming().adminNote == ''");
    expect(fsRules).toContain('resource.data.ownerId == request.auth.uid');

    expect(stRules).toContain(ADMIN_EMAIL);
    expect(stRules).toContain('match /projects/{allPaths=**}');
    expect(stRules).toContain('match /artisans/{allPaths=**}');
    expect(stRules).toContain('match /requests/{userId}/{allPaths=**}');
  });
});
