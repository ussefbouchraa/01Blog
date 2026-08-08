# Spring Boot Roadmap for Building **01Blog**

---

# Goal

Build a complete social blogging platform with:

* Authentication (JWT)
* User profiles
* Posts
* Likes
* Comments
* Subscriptions
* Notifications
* Reports
* Admin dashboard

---

# Phase 1 — Java Fundamentals (Prerequisite)

Before Spring Boot, make sure you are comfortable with:

## Java

* Classes & Objects
* OOP
* Interfaces
* Inheritance
* Collections (List, Set, Map)
* Exceptions
* Enums
* Generics
* Streams (basic)
* Lambda expressions (basic)

---

# Phase 2 — Spring Boot Fundamentals

These are the absolute basics.

## 1. What is Spring Boot?

Understand:

* Dependency Injection (IoC)
* Beans
* Spring Boot Starter
* Project Structure

You should know:

```
Application
│
├── Controller
├── Service
├── Repository
└── Entity
```

---

## 2. Spring Boot Project Structure

Learn the purpose of:

```
src
│
├── controller
├── service
├── repository
├── entity
├── dto
├── config
├── security
├── exception
└── util
```

---

## 3. Controllers

Learn:

* REST API
* @RestController
* @RequestMapping
* @GetMapping
* @PostMapping
* @PutMapping
* @DeleteMapping

Example endpoints:

```
GET /posts

POST /posts

PUT /posts/{id}

DELETE /posts/{id}
```

---

## 4. HTTP Methods

Understand:

* GET
* POST
* PUT
* PATCH
* DELETE

Also learn:

* Request Body
* Path Variables
* Query Parameters

---

## 5. DTO (Data Transfer Objects)

Why DTOs exist.

Difference between:

```
Entity

↓

DTO

↓

JSON
```

Learn:

* Request DTO
* Response DTO

---

## 6. Validation

Learn:

* @Valid
* @NotNull
* @NotBlank
* @Email
* @Size

---

# Phase 3 — Spring Data JPA

This is the heart of the backend.

Learn:

## Entities

```
@Entity
```

Primary key

```
@Id

@GeneratedValue
```

Columns

```
@Column
```

---

## Relationships

Very important.

Learn:

### One To Many

User → Posts

---

### Many To One

Post → User

---

### One To Many

Post → Comments

---

### Many To Many

User ↔ Followers

---

### One To Many

Post → Likes

---

## Repositories

Understand:

```
JpaRepository
```

Methods:

* save()
* findById()
* findAll()
* delete()
* exists()

Custom queries.

---

# Phase 4 — Service Layer

Business logic belongs here.

Example:

```
Controller

↓

Service

↓

Repository
```

Never place business logic inside Controllers.

---

# Phase 5 — Exception Handling

Learn:

* Global Exception Handler
* @ControllerAdvice
* Custom Exceptions

Examples:

* UserNotFound
* PostNotFound
* Unauthorized

---

# Phase 6 — Authentication

This is the biggest chapter.

Learn in this order.

---

## Password Encoding

BCrypt

---

## Login

How authentication works.

---

## JWT

Understand:

* Token
* Access Token
* Authorization Header

Flow:

```
Login

↓

JWT Token

↓

Client stores token

↓

Every request sends token

↓

Spring verifies token
```

---

## Spring Security

Learn:

* Security Filter Chain
* Authentication
* Authorization
* Roles

Roles:

```
USER

ADMIN
```

Protect routes.

Example:

```
/admin/**

↓

ADMIN only
```

---

# Phase 7 — File Upload

Users upload:

* Images
* Videos

Learn:

MultipartFile

Store files:

* Local folder
* AWS S3 (optional)

---

# Phase 8 — API Design

Create REST APIs.

Examples:

Authentication

```
POST /register

POST /login
```

Posts

```
GET /posts

POST /posts

PUT /posts/{id}

DELETE /posts/{id}
```

Comments

```
POST /posts/{id}/comments
```

Likes

```
POST /posts/{id}/like
```

Subscriptions

```
POST /users/{id}/subscribe

DELETE /users/{id}/subscribe
```

Reports

```
POST /reports
```

Notifications

```
GET /notifications
```

Admin

```
GET /admin/users

DELETE /admin/users/{id}
```

---

# Phase 9 — Testing

Learn:

* Postman
* HTTP Status Codes

Examples:

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

500 Internal Server Error

---

# Phase 10 — Optional Topics

After the project works.

Learn:

* Pagination
* Sorting
* Search
* WebSockets
* Email
* Docker
* Caching
* Logging

---

# Complete Database

Your project will probably contain these entities.

```
User

Post

Comment

Like

Subscription

Notification

Report

Role
```

---

# Entity Relationships

```
User
│
├── Posts
├── Comments
├── Likes
├── Notifications
├── Reports
└── Subscriptions

Post
│
├── Comments
├── Likes
└── User

Comment
│
├── User
└── Post

Like
│
├── User
└── Post

Subscription
│
├── Follower
└── Following

Notification
│
└── User

Report
│
├── Reporter
└── Reported User
```

---

# Recommended Learning Order

✅ Java Review

↓

✅ Spring Boot Basics

↓

✅ REST Controllers

↓

✅ HTTP & JSON

↓

✅ DTO

↓

✅ Validation

↓

✅ JPA & Relationships

↓

✅ Repository

↓

✅ Service Layer

↓

✅ Exception Handling

↓

✅ Spring Security

↓

✅ JWT Authentication

↓

✅ File Upload

↓

✅ Build Complete REST API

↓

✅ Testing with Postman

↓

✅ Connect Angular

↓

✅ Deploy

---

# Final Advice

Do **not** start with JWT or Spring Security.

Build the project in small steps:

1. Create the Spring Boot project.
2. Connect to the database.
3. Build CRUD for users.
4. Build CRUD for posts.
5. Add comments and likes.
6. Add subscriptions.
7. Add notifications.
8. Add reports.
9. Finally, secure everything with Spring Security and JWT.
10. Connect the Angular frontend only after the backend APIs are working well.
