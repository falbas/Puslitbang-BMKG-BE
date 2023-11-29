# Puslitbang BMKG Backend API

- [Users](#users)
  - [(POST) Register](#post-register)
  - [(POST) Login](#post-login)
  - [(GET) Verify 🔐](#get-verify)
- [Posts](#posts)
  - [(POST) Create Post 🔐](#post-create-post)
  - [(GET) Get All Posts](#get-get-all-posts)
  - [(GET) Get A Post By Slug](#get-get-a-post-by-slug)
  - [(GET) Get A Post By Id](#get-get-a-post-by-id)
  - [(PUT) Update Post 🔐](#put-update-post)
  - [(DELETE) Delete Post 🔐](#delete-delete-post)

# Users

## (POST) Register

```
/users/register
```

### Body

- JSON

```
{
    "name": "Ini Admin",
    "email": "tes@gmail.com",
    "password": "password123"
}
```

### Response

- 201 Created

```
{
    "message": "register successful"
}
```

- 400 Bad Request

```
{
    "message": "all input is required"
}
{
    "message": "email is already taken"
}
```

## (POST) Login

```
/users/login
```

### Body

- JSON

```
{
    "email": "tes@gmail.com",
    "password": "password123"
}
```

### Response

- 200 OK

```
{
    "message": "login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlczJAZ21haWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAxMTUzNTMwLCJleHAiOjE3MDExODIzMzB9.w-hUfVNveYh2zLr2Wrv7yACJEbIhGREnLvj8cdGAdp0"
}
```

- 400 Bad Request

```
{
    "message": "all input is required"
}
```

- 401 Unauthorized

```
{
    "message": "email or password is wrong"
}
```

## (GET) Verify

```
/users/verify
```

### Header

```
{
    "Authorization": "Bearer <token>"
}
```

### Response

- 200 OK

```
{
    "message": "authorized",
    "email": "tes@gmail.com",
    "role": "admin",
    "iat": 1701153790,
    "exp": 1701182590
}
```

- 401 Unauthorized

```
{
    "message": "user not authorized"
}
```

# Posts

## (POST) Create Post

```
/posts
```

### Header

```
{
    "Authorization": "Bearer <token>"
}
```

### Body

- form-data

| Key              | Value              |
| ---------------- | ------------------ |
| title            | title              |
| text             | text               |
| image (optional) | /path/to/image.jpg |
| slug (optional)  | slug               |
| tags (optional)  | tag1,tag2,tag3     |

### Response

- 201 Created

```
{
    "message": "create post successful"
}
```

- 400 Bad Request

```
{
    "message": "slug is already taken"
}
{
    "message": "title and text is required"
}
```

## (GET) Get All Posts

```
/posts
```

### Query Params

| Key              | Value            |
| ---------------- | ---------------- |
| q (optional)     | search by title  |
| limit (optional) | 10 (default: 10) |
| page (optional)  | 1                |
| tags (optional)  | tag1,tag2,tag3   |

### Response

- 200 OK

```
[
    {
        "id": 1,
        "title": "title",
        "text": "text",
        "image": "http://url/to/image.jpg",
        "author": "tes@gmail.com",
        "slug": "title",
        "created_at": "2023-11-28T07:34:30.000Z",
        "updated_at": "2023-11-28T07:34:30.000Z",
        "tags": "tag1,tag2,tag3"
    }
]
```

## (GET) Get A Post By Slug

```
/posts
```

### Query Params

| Key  | Value          |
| ---- | -------------- |
| slug | search-by-slug |

### Response

- 200 OK

```
{
    "id": 1,
    "title": "title",
    "text": "text",
    "image": "http://url/to/image.jpg",
    "author": "tes@gmail.com",
    "slug": "title",
    "created_at": "2023-11-28T07:34:30.000Z",
    "updated_at": "2023-11-28T07:34:30.000Z",
    "tags": "tag1,tag2,tag3"
}
```

- 404 Not Found

```
{
    "message": "post not found"
}
```

## (GET) Get A Post By Id

```
/posts/{id}
```

### Response

- 200 OK

```
{
    "id": 1,
    "title": "title",
    "text": "text",
    "image": "http://url/to/image.jpg",
    "author": "tes@gmail.com",
    "slug": "title",
    "created_at": "2023-11-28T07:34:30.000Z",
    "updated_at": "2023-11-28T07:34:30.000Z",
    "tags": "tag1,tag2,tag3"
}
```

- 404 Not Found

```
{
    "message": "post not found"
}
```

## (PUT) Update Post

```
/posts/{id}
```

### Header

```
{
    "Authorization": "Bearer <token>"
}
```

### Body

- form-data

| Key              | Value              |
| ---------------- | ------------------ |
| title (optional) | title              |
| text (optional)  | text               |
| image (optional) | /path/to/image.jpg |
| slug (optional)  | slug               |
| tags (optional)  | tag1,tag2,tag3     |

### Response

- 200 OK

```
{
    "message": "post updated"
}
```

- 404 Not Found

```
{
    "message": "post not found"
}
```

## (DELETE) Delete Post

```
/posts/{id}
```

### Header

```
{
    "Authorization": "Bearer <token>"
}
```

### Response

- 200 OK

```
{
    "message": "post deleted"
}
```

- 404 Not Found

```
{
    "message": "post not found"
}
```
