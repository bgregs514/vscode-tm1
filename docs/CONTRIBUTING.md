# Contributing to vscode-tm1
Thank you to all who have and will contribute!  This project wouldn't be possible without the support and expertise you bring.

# Style Guidelines (Work in progress)
While this project is written in TypeScript, many of the principles and recommendations found in the [Linux kernel coding style](https://www.kernel.org/doc/html/v4.10/process/coding-style.html) are applicable (as they are to most other projects as well).  This document is not written in stone - if there are changes or recommendations that you think would be beneficial, please log an issue and we'll talk about it!

## Indentation
The preferred spacing for tabs and indentations is __8 characters__.  This may seem like something straight out of the 80's, but there is a very good reason for keeping them this large.  If your logic gets too nested (anything over 3 levels), then there is most likely a better way to structure the code.  Seeing the code get pushed to the far right side of the screen due to these large tabs acts as an additional warning that you may need to take another look at your code.

**The only exception** is when dealing with json/metadata style pages.  For instance, using 8 character indentations in the package.json file would be extremely painful.  In these situations where there is no logic in the source file, 4 character indentations are acceptable.

## Braces and Spaces
This is another controversial topic where everyone seems to have different opinions.  Based on years of writing in different languages, these preferred styles have been found to be the most language agnostic, which helps to keep things easy to read when different languages are in play.

### Functions
`Functions` (__NOTE: This does not include `anonymous` functions__) should have an open brace on a new line, below the function name.  Functions should also __never have a space after the name__:
```typescript
function doCoolStuff(obj: MyObj): void
{
	console.log("Cool Stuff!");
}
```
This keeps non-nested functions easy to spot and separate from other structures in the code.

### Anonymous Functions
`Anonymous functions` are a bit special because they happen almost exclusively inline.  These special cases should be treated similarly to conditional or loop statements:
```typescript
myStandardFunction().then((response) => {
	console.log("Insert undocumented feature here").
}
```

### Everything Else
Pretty much every other type of structure in code should be treated with an open brace on the same line, and a space after the conditional or loop:
```typescript
switch (action) {
	case 1:
		return "one";
	case 2:
		return "two";
	default:
		return NULL;
}
```
Please note how this should look for conditional statements:
```typescript
if (myObj.name == "foo") {
	...Code;
} else {
	...More Code;
}
```
And finally loops:
```typescript
while (1 < myIterator) {
	...Stuff
	myIterator++;
}
```

## Comments
Comments should be placed above the function and structure definitions.  Comments should include a short, concise definition of __WHAT__ the function or structure's purpose is, but should not explain __HOW__ it works.  The best functions are simple and do one thing, so the code should be easy to understand without the need for comments.

This leads to the next point - comments should be avoided in the body of a function.  There are of course always very good reasons to include quick comments that point out tricky parts of code, etc., but in general the code should speak for itself.

The preferred style for function and structure comments is:
```typescript
/*
* This is a multiline comment that explains why function exists.
* It does not explain HOW the nested if statement logic works.
*/
```

Comments are a great resource and can save the next developer much headache when looking at old code, but the tendency by most programmers is to over-use them - myself included.  We're all smart people, but let's let our code speak for itself.

### TODO
There is one special case where inline comments are acceptable: `TODO` statements.  Given that much of this code will be changing, and different fires will be popping up in different places, there will be plenty of times when we want to come back and revisit code.  In this case, it is acceptable to write an inline comment anywhere in the code, as long as it is prefixed with `TODO`:
```typescript
/* TODO: This section of my function needs to be reworked because it is 1am and all I came up
* with was this
*/
```
