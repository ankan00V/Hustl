import { test, expect } from '@playwright/test';

test.describe('Hustl Landing Page E2E Test Suite', () => {
  let pageErrors: Error[] = [];

  test.beforeEach(({ page }) => {
    pageErrors = [];
    page.on('pageerror', (exception) => {
      pageErrors.push(exception);
    });
  });

  test.afterEach(() => {
    expect(pageErrors, 'Should not have any page errors').toEqual([]);
  });

  // TIER 1: Feature Coverage (Sanity)
  test('Tier 1: Load page and verify title matches', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Hustl - Tinder for Student Jobs | Swipe Your Way to Success');
  });

  test('Tier 1: Verify main layout sections are present in the DOM', async ({ page }) => {
    await page.goto('/');
    
    // Hero Section
    const heroSection = page.locator('section:has-text("Swipe. Match. Paid.")');
    await expect(heroSection).toBeVisible();

    // Swipe Demo Section
    const swipeSection = page.locator('section:has-text("Swipe to Apply")');
    await expect(swipeSection).toBeVisible();

    // Bento Grid Section
    const bentoSection = page.locator('section:has-text("More Than A Job Board")');
    await expect(bentoSection).toBeVisible();

    // Crowd Canvas Section
    const crowdSection = page.locator('section:has-text("Join the crowd")');
    await expect(crowdSection).toBeVisible();

    // Infinite Marquee Section
    const marqueeSection = page.locator('section:has-text("Swipe Right on Opportunity")');
    await expect(marqueeSection).toBeVisible();

    // Footer Section
    const footerSection = page.locator('footer');
    await expect(footerSection).toBeVisible();
  });

  test('Tier 1: Verify Lenis smooth scroll initialization', async ({ page }) => {
    await page.goto('/');
    
    // Verify Lenis initialization by checking the class 'lenis' or scrollbar on the html element
    const htmlElement = page.locator('html');
    const classList = await htmlElement.evaluate((el) => Array.from(el.classList));
    
    // Lenis typically adds class 'lenis' or 'lenis-smooth'
    const hasLenisClass = classList.some(cls => cls.includes('lenis'));
    
    expect(hasLenisClass).toBe(true);
  });

  // TIER 2: Boundary & Corner Cases
  test('Tier 2: Neo-Brutalist theme compliance', async ({ page }) => {
    await page.goto('/');
    
    // Assert background color of body matches warm neo-bg off-white color rgb(243, 240, 232)
    const bodyBg = await page.locator('body').evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bodyBg).toBe('rgb(243, 240, 232)');
    
    // Assert background color of main matches warm neo-bg off-white color rgb(243, 240, 232) or white
    const mainBg = await page.locator('main').evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(mainBg === 'rgb(243, 240, 232)' || mainBg === 'rgb(255, 255, 255)').toBe(true);

    // Verify Neo-Brutalist borders on Bento cards or buttons: check computed border-width is 6px and border-color is rgb(0, 0, 0)
    const bentoCard = page.locator('section:has-text("More Than A Job Board") .card-brutal').first();
    await expect(bentoCard).toBeVisible();

    const borderWidth = await bentoCard.evaluate(el => window.getComputedStyle(el).borderWidth);
    const borderColor = await bentoCard.evaluate(el => window.getComputedStyle(el).borderColor);
    expect(borderWidth).toBe('6px');
    expect(borderColor).toBe('rgb(0, 0, 0)');

    // Verify hard drop shadows on Bento cards or buttons: check computed box-shadow contains a hard offset (e.g. 12px 12px 0px 0px rgb(0, 0, 0) with a 0px blur radius)
    const boxShadow = await bentoCard.evaluate(el => window.getComputedStyle(el).boxShadow);
    expect(boxShadow).toContain('rgb(0, 0, 0)');
    expect(boxShadow).toContain('0px');
    expect(
      boxShadow.includes('12px 12px 0px 0px') ||
      /rgb\(0,\s*0,\s*0\)\s+12px\s+12px\s+0px\s+0px/.test(boxShadow) ||
      /\s+12px\s+12px\s+0px\s+0px\s+rgb\(0,\s*0,\s*0\)/.test(boxShadow)
    ).toBe(true);
  });

  test('Tier 2: Responsive Viewport Boundaries', async ({ page }) => {
    await page.goto('/');
    
    const viewports = [
      { name: 'mobile', width: 375, height: 800 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 800 }
    ];
    
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300); // Wait for layout updates
      
      // Assert no horizontal scrollbar is present
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `No horizontal scrollbar on ${vp.name}`).toBeLessThanOrEqual(vp.width);
    }
  });

  // TIER 3: Cross-Feature Interactions
  test('Tier 3: Simulating card drag gestures', async ({ page }) => {
    await page.goto('/');
    
    // Select the top Tinder card
    const card = page.locator('div.cursor-grab').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    
    const titleBefore = await card.locator('h3').textContent();
    expect(titleBefore).not.toBeNull();
    
    const boundingBox = await card.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    if (boundingBox) {
      // Drag horizontally by > 100px (e.g. 150px to the right)
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      // Move in increments to simulate drag
      await page.mouse.move(boundingBox.x + boundingBox.width / 2 + 30, boundingBox.y + boundingBox.height / 2, { steps: 5 });
      await page.mouse.move(boundingBox.x + boundingBox.width / 2 + 180, boundingBox.y + boundingBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }
    
    // Verify it disappears and the next card becomes top
    await expect(async () => {
      const nextCard = page.locator('div.cursor-grab').first();
      const titleAfter = await nextCard.locator('h3').textContent();
      expect(titleAfter).not.toBe(titleBefore);
    }).toPass({ timeout: 5000 });
  });

  test('Tier 3: Swipe demo exhaustion & reset', async ({ page }) => {
    await page.goto('/');
    
    // Swipe all 3 cards in succession
    for (let i = 0; i < 3; i++) {
      const card = page.locator('div.cursor-grab').first();
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      
      const title = await card.locator('h3').textContent();
      const boundingBox = await card.boundingBox();
      expect(boundingBox).not.toBeNull();
      
      if (boundingBox) {
        await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
        await page.mouse.down();
        // Alternate directions just to cover both left and right swipes
        const dragOffset = i % 2 === 0 ? 180 : -180;
        await page.mouse.move(boundingBox.x + boundingBox.width / 2 + (dragOffset / 5), boundingBox.y + boundingBox.height / 2, { steps: 5 });
        await page.mouse.move(boundingBox.x + boundingBox.width / 2 + dragOffset, boundingBox.y + boundingBox.height / 2, { steps: 10 });
        await page.mouse.up();
        
        // Wait for the swiped card to be completely detached from the DOM to avoid race conditions
        await expect(page.locator(`div.cursor-grab:has-text("${title}")`)).toHaveCount(0, { timeout: 5000 });
      }
    }
    
    // Check that "No more gigs!" and "Reset Demo" button appear
    const noMoreText = page.locator('p:has-text("No more gigs!")');
    await expect(noMoreText).toBeVisible();
    
    const resetButton = page.locator('button:has-text("Reset Demo")');
    await expect(resetButton).toBeVisible();
    
    // Click "Reset Demo"
    await resetButton.click();
    await page.waitForTimeout(300);
    
    // Verify cards are restored
    const firstCard = page.locator('div.cursor-grab').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('h3')).toHaveText('Barista @ Local Cafe');
  });

  // TIER 4: Real-World Scenarios
  test('Tier 4: Comprehensive User Interaction Flow', async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // 1. User scrolls the page
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(200);
    
    // 2. Scroll to the interactive Swipe Demo section
    const swipeSection = page.locator('section:has-text("Swipe to Apply")');
    await swipeSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    
    // 3. Swipe cards sequentially
    for (let i = 0; i < 3; i++) {
      const card = page.locator('div.cursor-grab').first();
      await expect(card).toBeVisible();
      
      const title = await card.locator('h3').textContent();
      const boundingBox = await card.boundingBox();
      if (boundingBox) {
        await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
        await page.mouse.down();
        await page.mouse.move(boundingBox.x + boundingBox.width / 2 + 30, boundingBox.y + boundingBox.height / 2, { steps: 5 });
        await page.mouse.move(boundingBox.x + boundingBox.width / 2 + 180, boundingBox.y + boundingBox.height / 2, { steps: 10 });
        await page.mouse.up();
        
        // Wait for the swiped card to be completely detached from the DOM
        await expect(page.locator(`div.cursor-grab:has-text("${title}")`)).toHaveCount(0, { timeout: 5000 });
      }
    }
    
    // 4. Verify exhaustion screen
    const resetButton = page.locator('button:has-text("Reset Demo")');
    await expect(resetButton).toBeVisible();
    
    // 5. Reset demo
    await resetButton.click();
    await page.waitForTimeout(300);
    
    // 6. Verify cards restored
    const topCard = page.locator('div.cursor-grab').first();
    await expect(topCard).toBeVisible();
    await expect(topCard.locator('h3')).toHaveText('Barista @ Local Cafe');
  });

  // TIER 5: Adversarial Coverage Hardening
  test('TC-5.1: Swipe Card Instant Snapping Verification', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('div.cursor-grab');
    await cards.first().scrollIntoViewIfNeeded();
    await expect(cards).toHaveCount(3);
    
    // Get the second card (index 1)
    const secondCard = cards.nth(1);
    
    // Swipe the first card to the right using the reliable 2-step drag sequence
    const firstCard = cards.first();
    const boundingBox = await firstCard.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + boundingBox.width / 2 + 30, boundingBox.y + boundingBox.height / 2, { steps: 5 });
      await page.mouse.move(boundingBox.x + boundingBox.width / 2 + 180, boundingBox.y + boundingBox.height / 2, { steps: 10 });
      await page.mouse.up();
    }
    
    // Immediately check translateY of the second card (which is now the front card)
    // It should start animating to 0, so it shouldn't be exactly 0 or 12 instantly.
    const getTranslateY = async () => {
      return await secondCard.evaluate((el) => {
        const style = window.getComputedStyle(el);
        const transform = style.transform;
        if (!transform || transform === 'none') return 0;
        const matrix = transform.match(/^matrix\((.+)\)$/);
        if (matrix) {
          return parseFloat(matrix[1].split(',')[5]);
        }
        const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
        if (matrix3d) {
          return parseFloat(matrix3d[1].split(',')[13]);
        }
        return 0;
      });
    };
    
    const yValue = await getTranslateY();
    // Verify it has started animating or moving from its initial stacked position of 12
    expect(yValue).toBeLessThan(12);
    
    // Wait for the animation to finish
    await page.waitForTimeout(500);
    const finalYValue = await getTranslateY();
    expect(finalYValue).toBeLessThan(4);
  });

  test('TC-5.4: Bento Card Zero-Dimension Robustness', async ({ page }) => {
    await page.goto('/');
    
    // Select the first Bento Card
    const card = page.locator('section:has-text("More Than A Job Board") div.border-4').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    
    // Set its dimensions to 0x0
    await card.evaluate((el) => {
      el.style.width = '0px';
      el.style.height = '0px';
      el.style.minWidth = '0px';
      el.style.minHeight = '0px';
      el.style.padding = '0px';
      el.style.margin = '0px';
      el.style.borderWidth = '0px';
    });
    
    // Trigger mousemove on the zero-dimension bento card
    await card.evaluate((el) => {
      const event = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
        cancelable: true,
      });
      el.dispatchEvent(event);
    });
    
    await page.waitForTimeout(100);
    
    // Check that styles or transform attributes do not contain NaN values
    const transform = await card.evaluate((el) => window.getComputedStyle(el).transform);
    expect(transform).not.toContain('NaN');
  });
});
