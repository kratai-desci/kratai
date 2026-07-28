<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <title>User Detail</title>
</head>
<body>
    <h1>User Detail</h1>
    <dl>
        <dt>ID:</dt>
        <dd>${user.id}</dd>
        <dt>Name:</dt>
        <dd>${user.name}</dd>
        <dt>Email:</dt>
        <dd>${user.email}</dd>
    </dl>
    <a href="/users">Back to List</a>
</body>
</html>
