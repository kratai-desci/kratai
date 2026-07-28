<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<!DOCTYPE html>
<html>
<head>
    <title>User Form</title>
</head>
<body>
    <h1>User Form</h1>
    <form method="post" action="/users">
        <label>Name: <input type="text" name="name" /></label><br/>
        <label>Email: <input type="email" name="email" /></label><br/>
        <button type="submit">Submit</button>
    </form>
    <a href="/users">Cancel</a>
</body>
</html>
