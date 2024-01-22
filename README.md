# Puslitbang BMKG Backend API

- [Users](#users)
  - [(POST) Register](#post-register)
  - [(POST) Login](#post-login)
  - [(GET) Verify 🔐](#get-verify)
  - [(PATCH) Update User 🔐](#patch-update)
  - [(DELETE) Delete User 🔐](#delete-delete-user)
  - [(GET) Get All Users 🔐](#get-read-all-users)
  - [(GET) User Info 🔐](#get-user-info)
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

## (PATCH) Update User

```
/users
```

### Body

- JSON

```
{
    "name": "Admin",
    "password": "password123"
}
```

### Response

- 200 OK

```
{
    "message": "user updated"
}
```

## (DELETE) Delete User

```
/users/{email}
```

### Response

- 200 OK

```
{
    "message": "user deleted"
}
```

- 401 Unauthorized

```
{
    "message": "permission denied"
}
```

## (GET) Get All Users

```
/users
```

### Response

- 200 OK

```
{
    "page": 1,
    "limit": 10,
    "total_pages": 1,
    "total": 2,
    "data": [
        {
            "email": "superadmin@tes.com",
            "name": "Superadmin",
            "role": "superadmin",
            "created_at": "2023-11-22T10:14:39.000Z",
            "updated_at": "2023-12-18T00:58:34.000Z"
        }
    ]
}
```

- 401 Unauthorized

```
{
    "message": "permission denied"
}
```

## (GET) User Info

```
/users/info
```

### Response

- 200 OK

```
{
    "data": {
        "email": "admin@tes.com",
        "name": "Admin gan",
        "role": "admin",
        "created_at": "2024-01-12T01:20:55.000Z",
        "updated_at": "2024-01-22T03:29:35.000Z"
    }
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
{
    "page": 1,
    "limit": 4,
    "total_pages": 2,
    "total_posts": 7,
    "data": [
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
}
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
