---
marp: true
theme: default
paginate: true
header: "M'sieur ca marche pas"
footer: 'Web 3 2025 - Vinci'
---

> M'sieur ca marche pas !

---

# Problem solving 101

---

## Digging in the stack

We generally identify an error by looking at the application and not seeing what we expect.

---

> Today's example: expenses list not showing

---

### Solving a bug is generally easy...

... the hard part is _finding_ it

---

### Going back the stack

- From frontend/ui
- To backend
- To database

---

### The expense list

Web is wonderful - we have a default system showing us errors, built in the browser: it's called the console.

We have to have the architecture in mind:

- The front end is sending http request & getting responses from the backend
- The backend send SQL queries (possibly via an ORM) and get record sets back from the database

---

## Step 1: Is your lights on?

- Is the front end running ?
- Is the back end running ?
- Is the database running ?

---

### Is the front end running ?

- Is your npm process running ?
- Do you have an answer at localhost:3000

There is a huge difference between a blank page, a "not found" or a "no response".

Look a the console to be sure.

---

### Is the backend running ?

We are exposing endpoints such as /api/expenses which are not protected. This means you can go in your browser and just test them.

Is there a response ? Is it the one you expect ?

---

### Is the database running ?

Open prisma studio (if using it) or any database client (can be directly from VS Code or something like DBeaver).

Can you connect to the database ? Are the tables that you expect there ?

Can you make a query ?

---

> J'ai un super pouvoir - je sais lire des logs
>
> - Un collègue

---

## Logs, traces and other console.log

---

### Front end

Open the console and the network tab. Look at the request sent & the responses.

If the response looks good (you see the expenses JSON), the problem is in the front end. Look more closely at the error message, it should point you toward a specific class/method

If you don't understand what's happening, add console.log at key points to see where the error occurs.

---

### Back end

Trigger an endpoint and look at the logs under your server start. Errors will show up there.

If you don't understand what's happening, add console.log at key points to see where the error occurs.

---

Solving a bug is generally easy once you can look at 10 lines of code (vs 500). Your goal should be to find those 10 lines by methodic search - not guess the issue (it's probably not the one you think).

---

# TL, DR:

We're here to help you during the lesson - but you can't call one of us with just "it does not work" - we're not going with you in your internship nor in your future job.

- What did you try ?
- What's on the console ? µ
- Which part of the software is not behaving the way you expect ?

Troubleshooting issues (made by others or by yourselves) is an integral part of the developer job. Use this opportunity to learn to help yourself.
