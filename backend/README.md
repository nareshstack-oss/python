# Tiffin Center Backend

## Features

- Public menu endpoint
- Customer order placement
- Admin login
- Admin food item management
- End-of-day summary

## Run

```bash
cd backend
mvn spring-boot:run
```

## Default admin credentials

- Username: `admin`
- Password: `admin123`

## API endpoints

- `GET /api/menu`
- `POST /api/orders`
- `POST /api/admin/login`
- `GET /api/admin/items`
- `POST /api/admin/items`
- `PUT /api/admin/items/{id}`
- `GET /api/admin/summary/today`
