import { test, expect } from '@playwright/test';
import { password, username } from '../fixtures/users.json';
let USERID, USERNAME, TOKEN, responsePromise, booksResponse, booksCountOnUi, newPageCount;

test('Task 4', async ({ page, context }) => {
  await test.step('Log in to demoqa', async ( ) => {
    await page.goto('https://demoqa.com/login');

    await page.locator('#userName').fill(username);

    await page.locator('#password').fill(password);

    await page.locator('#login').click();

    await expect(page).toHaveURL(/.*profile/);
  })
  
  await test.step('Get cookies', async () => {
    const cookies = await context.cookies('https://demoqa.com/');

    await test.step('Verify userID cookie', async () => {
      await expect(cookies.find(c => c.name === 'userID')?.value).toBeTruthy();
  
      USERID = cookies.find(c => c.name === 'userID')?.value;
    });

    await test.step('Verify userName cookie', async () => {
      await expect(cookies.find(c => c.name === 'userName')?.value).toBeTruthy();
  
      USERNAME = cookies.find(c => c.name === 'userName')?.value;
    });

    await test.step('Verify expires cookie', async () => {
      await expect(cookies.find(c => c.name === 'expires')?.value).toBeTruthy();
    });
  
    await test.step('Verify token cookie', async () => {
      await expect(cookies.find(c => c.name === 'token')?.value).toBeTruthy();
 
      TOKEN = cookies.find(c => c.name === 'token')?.value;
    });
  });

  await test.step('Block images via page.route', async () => {
    //Once route is enabled, every request matching the url pattern will stall unless it's continued, fulfilled or aborted
    //Block .png and .jpeg images
    await page.route(/.(png|jpeg|img)$/, route => route.abort());
  });

  await test.step('Veify status code of GET request', async () => {
    //Returns the matched response
    responsePromise = page.waitForResponse(response =>
      response.url() === 'https://demoqa.com/BookStore/v1/Books' && response.status() === 200
    );
  });

  await test.step('Make a screenshot of the Books page', async () => {
    await page.locator('#gotoStore').click();
  
    //await заставит интерпретатор JavaScript ждать до тех пор, пока промис справа от await не выполнится
    booksResponse = await responsePromise;
  
    await expect(page).toHaveURL(/.*books/);
  
    await page.screenshot({ path: 'screenshot.png' });
  });

  await test.step('Verify status code of GET request', async () => {
    //we assert by using expect condition for the ok message and status code 200.
    expect(booksResponse.ok()).toBeTruthy();

    expect(booksResponse.status()).toBe(200);
  });

  await test.step('Verify that number of books on the UI = number of books in the body ', async () => {
    //returns the JSON representation of response body.
    //This method will throw if the response body is not parsable via JSON.parse
    const booksCountInResponse = await booksResponse.json().then(data => {
      return data.books.length;
    });

    booksCountOnUi = await page.locator('.rt-tbody>div img').count();

    expect(booksCountInResponse).toEqual(booksCountOnUi);
  });

  await test.step('Change number of pages to the random value', async () => {
    newPageCount = Math.floor(Math.random() * (1000 - 1) + 1);

    console.log(`New page count should be ${newPageCount}`);

    //page.route() to mock network in a single page.
    page.route('https://demoqa.com/BookStore/v1/Book?**', async route => {
      //Fetch original response.
      const response = await route.fetch();
      let body = await response.text();

      body = body.replace(await response.json().then(data => data.pages), newPageCount);
      route.fulfill({
        //Pass all fields from the response.
        response,
        //Override response body.
        body
      });
    });
  });

  await test.step('Verify that number of pages was updated', async () => {
    const bookNumber = Math.floor(Math.random() * (booksCountOnUi - 1) + 1);
 
    await page.locator(`.rt-tbody>div:nth-child(${bookNumber}) a`).click();
  
    await expect(page.locator('#pages-wrapper #userName-value')).toHaveText(newPageCount.toString());
  
    await page.screenshot({ path: 'BookContext.png' });  
  });
  
  await test.step('Verify info in Account request', async () => {
    const response = await page.request.get(`https://demoqa.com/Account/v1/User/${USERID}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });
        
    expect(await response.json().then(data => data.username)).toEqual(USERNAME);
        
    expect(await response.json().then(data => data.books.length)).toBe(0);
  });
});
