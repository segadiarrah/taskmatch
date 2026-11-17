import { test, expect, type Page } from '@playwright/test';

async function session(page: Page) {
  await page.addInitScript(() => { localStorage.setItem('auth_token','human-test'); localStorage.setItem('taskmatch_locale','en'); });
  await page.route('**/api/v1/auth/me', r => r.fulfill({json:{id:'owner',full_name:'Customer',role:'client',is_active:true}}));
  await page.route('**/api/v1/human-tasks', r => r.fulfill({json:{items:[]}}));
  await page.route('**/api/v1/workers/me', r => r.fulfill({json:null}));
  await page.route('**/api/v1/human-tasks/opportunities', r => r.fulfill({json:{items:[]}}));
  await page.route('**/api/v1/human-tasks/taxonomy',r=>r.fulfill({json:{categories:[{id:'translation_review',execution_mode:'remote',evidence:['report'],authorizations:['data_owner_consent']}]}}));
}

test('client creates human request on mobile without technical identifiers', async ({page})=>{
  await session(page);
  await page.setViewportSize({width:390,height:844});
  await page.route('**/api/v1/principals',r=>r.fulfill({json:{id:'principal'}}));
  await page.route('**/api/v1/human-tasks',r=>{
    if(r.request().method()==='POST') {
      const body=r.request().postDataJSON();
      expect(body.budget.amount_minor).toBe(1100);
      expect(body.principal_id).toBe('principal');
      expect(r.request().headers()['idempotency-key']).toBeTruthy();
      return r.fulfill({status:201,json:{...body,task_id:'task',status:'pending',policy_status:'pending'}});
    }
    return r.fulfill({json:{items:[]}});
  });
  await page.goto('/human-tasks');
  await page.getByLabel('Mission title').fill('Review translation');
  await page.getByLabel('What needs to be done?').fill('Find translation errors.');
  await page.getByLabel('Instructions',{exact:true}).fill('Read the supplied translation and send a report.');
  await page.getByLabel('Deadline').fill('2026-12-20T12:00');
  await page.getByLabel('Total spending limit').fill('11');
  await page.getByRole('button',{name:'Submit for review',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('worker saves profile before payment setup', async ({page})=>{
  await session(page);
  await page.route('**/api/v1/workers/me',r=>r.fulfill({json:r.request().method()==='PUT' ? {...r.request().postDataJSON(),verification_status:'pending',payment_eligible:false}:null}));
  await page.goto('/human-tasks');
  await page.getByRole('button',{name:'Find work',exact:true}).click();
  await page.getByLabel('Skills, separated').fill('translation');
  await page.getByLabel('I consent').check();
  await page.getByRole('button',{name:'Save profile'}).click();
  await expect(page.getByRole('status')).toContainText('Saved');
  await expect(page.getByText('Verification and payment setup',{exact:false})).toBeVisible();
});

test('load failure provides retry without silently showing empty results', async ({page})=>{
  await session(page);
  await page.route('**/api/v1/human-tasks',r=>r.fulfill({status:503,json:{detail:'Temporarily unavailable'}}));
  await page.goto('/human-tasks');
  await expect(page.getByRole('alert').filter({hasText:'Temporarily unavailable'})).toContainText('Temporarily unavailable');
  await expect(page.getByRole('button',{name:'Refresh',exact:true})).toBeVisible();
});
