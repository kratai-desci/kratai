# tmp.VzghXepbm6

Generated: 8/25/2026, 9:11:04 PM
Total: 178 classes, 1260 relationships

---

## Project Structure

```
├── backend
│   └── app
│       ├── alembic
│       │   ├── env.py
│       │   └── versions
│       │       ├── 1a31ce608336_add_cascade_delete_relationships.py
│       │       ├── 9c0a54914c78_add_max_length_for_string_varchar_.py
│       │       ├── d98dd8ec85a3_edit_replace_id_integers_in_all_models_.py
│       │       ├── e2412789c190_initialize_models.py
│       │       └── fe56fa70289e_add_created_at_to_user_and_item.py
│       ├── api
│       │   ├── deps.py
│       │   └── routes
│       │       ├── items.py
│       │       ├── login.py
│       │       ├── private.py
│       │       ├── users.py
│       │       └── utils.py
│       ├── backend_pre_start.py
│       ├── core
│       │   ├── config.py
│       │   ├── db.py
│       │   └── security.py
│       ├── crud.py
│       ├── email-templates
│       │   ├── new_account.html
│       │   └── reset_password.html
│       ├── initial_data.py
│       ├── main.py
│       ├── models.py
│       ├── tests_pre_start.py
│       └── utils.py
├── frontend
│   ├── index.html
│   ├── openapi-ts.config.ts
│   ├── playwright.config.ts
│   ├── src
│   │   ├── client
│   │   │   ├── client.gen.ts
│   │   │   ├── client
│   │   │   │   ├── client.gen.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── types.gen.ts
│   │   │   │   └── utils.gen.ts
│   │   │   ├── core
│   │   │   │   ├── auth.gen.ts
│   │   │   │   ├── bodySerializer.gen.ts
│   │   │   │   ├── params.gen.ts
│   │   │   │   ├── pathSerializer.gen.ts
│   │   │   │   ├── queryKeySerializer.gen.ts
│   │   │   │   ├── serverSentEvents.gen.ts
│   │   │   │   ├── types.gen.ts
│   │   │   │   └── utils.gen.ts
│   │   │   ├── index.ts
│   │   │   └── sdk.gen.ts
│   │   ├── components
│   │   │   ├── Admin
│   │   │   │   ├── AddUser.tsx
│   │   │   │   ├── DeleteUser.tsx
│   │   │   │   ├── EditUser.tsx
│   │   │   │   ├── UserActionsMenu.tsx
│   │   │   │   └── columns.tsx
│   │   │   ├── Common
│   │   │   │   ├── Appearance.tsx
│   │   │   │   ├── AuthLayout.tsx
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── ErrorComponent.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Logo.tsx
│   │   │   │   └── NotFound.tsx
│   │   │   ├── Items
│   │   │   │   ├── AddItem.tsx
│   │   │   │   ├── DeleteItem.tsx
│   │   │   │   ├── EditItem.tsx
│   │   │   │   ├── ItemActionsMenu.tsx
│   │   │   │   └── columns.tsx
│   │   │   ├── Pending
│   │   │   │   ├── PendingItems.tsx
│   │   │   │   └── PendingUsers.tsx
│   │   │   ├── Sidebar
│   │   │   │   ├── AppSidebar.tsx
│   │   │   │   ├── Main.tsx
│   │   │   │   └── User.tsx
│   │   │   ├── UserSettings
│   │   │   │   ├── ChangePassword.tsx
│   │   │   │   ├── DeleteAccount.tsx
│   │   │   │   ├── DeleteConfirmation.tsx
│   │   │   │   └── UserInformation.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── ui
│   │   │       ├── alert.tsx
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── button-group.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── checkbox.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── form.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── loading-button.tsx
│   │   │       ├── pagination.tsx
│   │   │       ├── password-input.tsx
│   │   │       ├── select.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── table.tsx
│   │   │       ├── tabs.tsx
│   │   │       └── tooltip.tsx
│   │   ├── hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCopyToClipboard.ts
│   │   │   ├── useCustomToast.ts
│   │   │   └── useMobile.ts
│   │   ├── lib
│   │   │   └── utils.ts
│   │   ├── main.tsx
│   │   ├── routeTree.gen.ts
│   │   ├── routes
│   │   │   ├── __root.tsx
│   │   │   ├── _layout.tsx
│   │   │   ├── _layout
│   │   │   │   ├── admin.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── items.tsx
│   │   │   │   └── settings.tsx
│   │   │   ├── login.tsx
│   │   │   ├── recover-password.tsx
│   │   │   ├── reset-password.tsx
│   │   │   └── signup.tsx
│   │   ├── utils.ts
│   │   └── vite-env.d.ts
│   └── vite.config.ts
└── packages
    └── react-email
        ├── emails
        │   ├── new_account.tsx
        │   └── reset_password.tsx
        └── ui
            ├── Button.tsx
            ├── Callout.tsx
            ├── Heading.tsx
            ├── Layout.tsx
            └── Link.tsx
```
---

## Classes (178)

[env] (module)
Methods:
- + get_url(): None
- + run_migrations_offline(): None
- + run_migrations_online(): None
---

[1a31ce608336_add_cascade_delete_relationships] (module)
Methods:
- + upgrade(): None
- + downgrade(): None
---

[9c0a54914c78_add_max_length_for_string_varchar_] (module)
Methods:
- + upgrade(): None
- + downgrade(): None
---

[d98dd8ec85a3_edit_replace_id_integers_in_all_models_] (module)
Methods:
- + upgrade(): None
- + downgrade(): None
---

[e2412789c190_initialize_models] (module)
Methods:
- + upgrade(): None
- + downgrade(): None
---

[fe56fa70289e_add_created_at_to_user_and_item] (module)
Methods:
- + upgrade(): None
- + downgrade(): None
---

[deps] (module)
Methods:
- + get_db(): Generator[Session]
- + get_current_user(session: SessionDep, token: TokenDep): User
- + get_current_active_superuser(current_user: CurrentUser): User
Uses: User (uses)
---

[items] (module)
Methods:
- + read_item(session: SessionDep, current_user: CurrentUser, id: uuid.UUID): Any
---

[login] (module)
Methods:
- + test_token(current_user: CurrentUser): Any
- + recover_password(email: str, session: SessionDep): Message
- + reset_password(session: SessionDep, body: NewPassword): Message
- + recover_password_html_content(email: str, session: SessionDep): Any
Uses: Message (uses), NewPassword (uses)
---

PrivateUserCreate
Extends: BaseModel
Properties:
- + email: str
- + password: str
- + full_name: str
- + is_verified: bool
Used By: [private] (uses)
---

[private] (module)
Methods:
- + create_user(user_in: PrivateUserCreate, session: SessionDep): Any
Uses: PrivateUserCreate (uses)
---

[users] (module)
Methods:
- + read_users(session: SessionDep, skip: int, limit: int): Any
- + create_user(*: Any, session: SessionDep, user_in: UserCreate): Any
- + read_user_me(current_user: CurrentUser): Any
- + delete_user_me(session: SessionDep, current_user: CurrentUser): Any
- + register_user(session: SessionDep, user_in: UserRegister): Any
Uses: UserCreate (uses), UserRegister (uses)
---

[utils] (module)
Methods:
- + test_email(email_to: EmailStr): Message
- + health_check(): bool [async]
Uses: Message (uses)
---

[backend_pre_start] (module)
Methods:
- + init(db_engine: Engine): None
- + main(): None
---

Settings
Extends: BaseSettings
Properties:
- + API_V1_STR: str
- + SECRET_KEY: str
- + ACCESS_TOKEN_EXPIRE_MINUTES: int
- + FRONTEND_HOST: str
- + FASTAPI_ENV: Literal
- + PROJECT_NAME: str
- + SENTRY_DSN: HttpUrl
- + DATABASE_URL: PostgresDsn
- + EMAILS_FROM_NAME: Any
Methods:
- - _use_psycopg_driver(cls: Any, value: str | PostgresDsn): str [static]
- - _set_default_emails_from(): Self
- + emails_enabled(): bool
- - _check_default_secret(var_name: str, value: str | None): None
- - _enforce_non_default_secrets(): Self
---

[db] (module)
Methods:
- + init_db(session: Session): None
---

[security] (module)
Methods:
- + create_access_token(subject: str | Any, expires_delta: timedelta): str
- + get_password_hash(password: str): str
---

[crud] (module)
Methods:
- + create_user(*: Any, session: Session, user_create: UserCreate): User
- + update_user(*: Any, session: Session, db_user: User, user_in: UserUpdate): Any
- + get_user_by_email(*: Any, session: Session, email: str): User | None
- + authenticate(*: Any, session: Session, email: str, password: str): User | None
- + create_item(*: Any, session: Session, item_in: ItemCreate, owner_id: uuid.UUID): Item
Uses: UserCreate (uses), User (uses), UserUpdate (uses), ItemCreate (uses), Item (uses)
---

new_account.html (template)
---

reset_password.html (template)
---

[initial_data] (module)
Methods:
- + init(): None
- + main(): None
---

[main] (module)
Methods:
- + custom_generate_unique_id(route: APIRoute): str
---

UserBase
Extends: SQLModel
Properties:
- + email: EmailStr
- + is_active: bool
- + is_superuser: bool
- + full_name: str
Used By: UserCreate (extends), User (extends), UserPublic (extends)
---

UserCreate
Extends: UserBase
Properties:
- + password: str
Uses: UserBase (extends)
Used By: [users] (uses), [crud] (uses)
---

UserRegister
Extends: SQLModel
Properties:
- + email: EmailStr
- + password: str
- + full_name: str
Used By: [users] (uses)
---

UserUpdate
Extends: SQLModel
Properties:
- + email: EmailStr
- + is_active: bool
- + is_superuser: bool
- + full_name: str
- + password: str
Used By: [crud] (uses)
---

UserUpdateMe
Extends: SQLModel
Properties:
- + full_name: str
- + email: EmailStr
---

UpdatePassword
Extends: SQLModel
Properties:
- + current_password: str
- + new_password: str
---

User
Extends: UserBase
Properties:
- + id: uuid
- + hashed_password: str
- + created_at: datetime
- + items: list
Uses: UserBase (extends)
Used By: [deps] (uses), [crud] (uses), Item (uses)
---

UserPublic
Extends: UserBase
Properties:
- + id: uuid
- + created_at: datetime
Uses: UserBase (extends)
---

UsersPublic
Extends: SQLModel
Properties:
- + data: list
- + count: int
---

ItemBase
Extends: SQLModel
Properties:
- + title: str
- + description: str
Used By: ItemCreate (extends), Item (extends), ItemPublic (extends)
---

ItemCreate
Extends: ItemBase
Uses: ItemBase (extends)
Used By: [crud] (uses)
---

ItemUpdate
Extends: SQLModel
Properties:
- + title: str
- + description: str
---

Item
Extends: ItemBase
Properties:
- + id: uuid
- + created_at: datetime
- + owner_id: uuid
- + owner: User
Uses: ItemBase (extends), User (uses)
Used By: [crud] (uses)
---

ItemPublic
Extends: ItemBase
Properties:
- + id: uuid
- + owner_id: uuid
- + created_at: datetime
Uses: ItemBase (extends)
---

ItemsPublic
Extends: SQLModel
Properties:
- + data: list
- + count: int
---

Message
Extends: SQLModel
Properties:
- + message: str
Used By: [login] (uses), [utils] (uses)
---

Token
Extends: SQLModel
Properties:
- + access_token: str
- + token_type: str
---

TokenPayload
Extends: SQLModel
Properties:
- + sub: str
---

NewPassword
Extends: SQLModel
Properties:
- + token: str
- + new_password: str
Used By: [login] (uses)
---

[models] (module)
Methods:
- + get_datetime_utc(): datetime
---

[tests_pre_start] (module)
Methods:
- + init(db_engine: Engine): None
- + main(): None
---

EmailData
Properties:
- + html_content: str
- + subject: str
- + email_to: str
Used By: [utils] (uses)
---

[utils] (module)
Methods:
- + render_email_template(*: Any, template_name: str, context: dict[str, Any: Any): str
- + generate_test_email(email_to: str): EmailData
- + generate_reset_password_email(email_to: str, email: str, token: str): EmailData
- + generate_password_reset_token(email: str): str
- + verify_password_reset_token(token: str): str | None
Uses: EmailData (uses)
---

index.html (template)
---

openapi-ts.config (module)
---

playwright.config (module)
---

[client.gen] (module)
Methods:
- + createClient(config: Config): Client [static]
Uses: Config (parameter, imports, generic), Config (parameter, imports, generic), createSseClient (imports), HttpMethod (imports), getValidRequestBody (imports), Client (imports), RequestOptions (imports, generic), buildUrl (imports), createConfig (imports), mergeConfigs (imports), mergeHeaders (imports), setAuthParams (imports), [utils.gen] (calls, async-calls), [utils.gen] (calls), [serverSentEvents.gen] (calls)
Used By: [client.gen] (calls)
---

index (module)
Uses: Auth (re-exports), QuerySerializerOptions (re-exports), formDataBodySerializer (re-exports), jsonBodySerializer (re-exports), urlSearchParamsBodySerializer (re-exports), buildClientParams (re-exports), serializeQueryKeyValue (re-exports), createClient (re-exports), Client (re-exports), ClientOptions (re-exports), Config (re-exports), Config (re-exports), CreateClientConfig (re-exports), Options (re-exports), RequestOptions (re-exports), RequestResult (re-exports), TDataShape (re-exports), createConfig (re-exports)
---

Config (interface)
Implements: Omit, CoreConfig
Properties:
- + axios: AxiosStatic | AxiosInstance
- + baseURL: T['baseURL']
- + headers: | AxiosRequestHeaders
    | Record<
        string,
        string | number | boolean | (string | number | boolean)[] | null | undefined | unknown
      >
- + throwOnError: T['throwOnError']
Uses: Auth (imports), ServerSentEventsOptions (imports), ServerSentEventsResult (imports), CoreClient (imports), CoreConfig (imports)
Used By: [client.gen] (parameter, imports, generic), index (re-exports), RequestOptions (implements), [utils.gen] (returns, parameter, imports, generic), [client.gen] (imports), StreamEvent (imports), [serverSentEvents.gen] (imports)
---

RequestOptions (interface)
Implements: Config, Pick
Properties:
- + body: unknown
- + path: Record<string, unknown>
- + query: Record<string, unknown>
- + security: ReadonlyArray<Auth>
- + url: Url
Uses: Config (implements), Config (implements), Auth (composition, imports), ServerSentEventsOptions (imports), ServerSentEventsResult (imports), CoreClient (imports), CoreConfig (imports)
Used By: [client.gen] (imports, generic), index (re-exports), [utils.gen] (parameter, imports, generic)
---

ClientOptions (interface)
Properties:
- + baseURL: string
- + throwOnError: boolean
Uses: Auth (imports), ServerSentEventsOptions (imports), ServerSentEventsResult (imports), CoreClient (imports), CoreConfig (imports)
Used By: index (re-exports), [utils.gen] (returns, parameter, imports, generic), [client.gen] (imports), index (re-exports)
---

TDataShape (interface)
Properties:
- + body: unknown
- + headers: unknown
- + path: unknown
- + query: unknown
- + url: string
Uses: Auth (imports), ServerSentEventsOptions (imports), ServerSentEventsResult (imports), CoreClient (imports), CoreConfig (imports)
Used By: index (re-exports), LoginService (imports), UsersService (imports), UtilsService (imports), ItemsService (imports), PrivateService (imports)
---

[utils.gen] (module)
Properties:
- + axiosHeadersKeywords: inferred [static] [readonly]
Methods:
- + createQuerySerializer({
  parameters = {},
  ...args
}: QuerySerializerOptions): any [static]
- + checkForExistence(options: Pick<RequestOptions, 'auth' | 'query'> & {
    headers: Record<any, unknown>;
  }, name: string): boolean [static]
- + setAuthParams(options: Pick<RequestOptions, 'auth' | 'query' | 'security'> & {
    headers: Record<any, unknown>;
  }): Promise<void> [static] [async]
- + buildUrl(options: any): any [static]
- + mergeConfigs(a: Config, b: Config): Config [static]
- + mergeHeaders(headers: Array<Required<Config>['headers'] | undefined>): Record<any, unknown> [static]
- + createConfig(override: Config<Omit<ClientOptions, keyof T> & T>): Config<Omit<ClientOptions, keyof T> & T> [static]
Uses: Config (returns, parameter, imports, generic), Config (returns, parameter, imports, generic), ClientOptions (returns, parameter, imports, generic), RequestOptions (parameter, imports, generic), getAuthToken (imports), QuerySerializerOptions (imports), serializeArrayParam (imports), serializeObjectParam (imports), serializePrimitiveParam (imports), getUrl (imports), Client (imports), [pathSerializer.gen] (calls), [auth.gen] (async-calls, calls), [utils.gen] (calls)
Used By: [client.gen] (calls, async-calls), [client.gen] (calls)
---

[client.gen] (module)
Properties:
- + client: inferred [static] [readonly]
Uses: ClientOptions (imports), Config (imports), Config (imports), createClient (imports), createConfig (imports), ClientOptions2 (imports), [client.gen] (calls), [utils.gen] (calls)
---

Auth (interface)
Properties:
- + in: 'header' | 'query' | 'cookie'
- + name: string
- + scheme: 'basic' | 'bearer'
- + type: 'apiKey' | 'http'
Used By: index (re-exports), Config (imports), RequestOptions (composition, imports), ClientOptions (imports), TDataShape (imports), [auth.gen] (parameter, generic), Config (composition, imports)
---

[auth.gen] (module)
Methods:
- + getAuthToken(auth: Auth, callback: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken): Promise<string | undefined> [static] [async]
Uses: Auth (parameter, generic)
Used By: [utils.gen] (async-calls, calls)
---

[bodySerializer.gen] (module)
Properties:
- + formDataBodySerializer: inferred [static] [readonly]
- + jsonBodySerializer: inferred [static] [readonly]
- + urlSearchParamsBodySerializer: inferred [static] [readonly]
Methods:
- + serializeFormDataPair(data: FormData, key: string, value: unknown): void [static]
- + serializeUrlSearchParamsPair(data: URLSearchParams, key: string, value: unknown): void [static]
Uses: ArrayStyle (imports), ObjectStyle (imports), SerializerOptions (imports)
---

Fields (interface)
Properties:
- + allowExtra: Partial<Record<Slot, boolean>>
- + args: ReadonlyArray<Field>
Uses: [params.gen] (calls), Params (generic)
---

Params (interface)
Properties:
- + body: unknown
- + headers: Record<string, unknown>
- + path: Record<string, unknown>
- + query: Record<string, unknown>
Uses: [params.gen] (calls)
Used By: Fields (generic), [params.gen] (parameter, generic)
---

[params.gen] (module)
Methods:
- + buildKeyMap(fields: FieldsConfig, map: KeyMap): KeyMap [static]
- + stripEmptySlots(params: Params): any [static]
- + buildClientParams(args: ReadonlyArray<unknown>, fields: FieldsConfig): any [static]
Uses: Params (parameter, generic)
Used By: Fields (calls), Params (calls)
---

SerializeOptions (interface)
Implements: SerializePrimitiveOptions, SerializerOptions
Uses: SerializePrimitiveOptions (implements), SerializerOptions (implements), [pathSerializer.gen] (calls), SerializePrimitiveParam (generic)
Used By: SerializePrimitiveOptions (generic), SerializerOptions (generic), SerializePrimitiveParam (generic), [pathSerializer.gen] (parameter, generic)
---

SerializePrimitiveOptions (interface)
Properties:
- + allowReserved: boolean
- + name: string
Uses: [pathSerializer.gen] (calls), SerializeOptions (generic), SerializePrimitiveParam (generic)
Used By: SerializeOptions (implements), SerializePrimitiveParam (implements)
---

SerializerOptions (interface)
Properties:
- + explode: boolean
- + style: T
Uses: [pathSerializer.gen] (calls), SerializeOptions (generic), SerializePrimitiveParam (generic)
Used By: [bodySerializer.gen] (imports), SerializeOptions (implements)
---

SerializePrimitiveParam (interface)
Implements: SerializePrimitiveOptions
Properties:
- + value: string
Uses: SerializePrimitiveOptions (implements), [pathSerializer.gen] (calls), SerializeOptions (generic)
Used By: SerializeOptions (generic), SerializePrimitiveOptions (generic), SerializerOptions (generic), [pathSerializer.gen] (parameter, generic)
---

[pathSerializer.gen] (module)
Methods:
- + separatorArrayExplode(style: ArraySeparatorStyle): any [static]
- + separatorArrayNoExplode(style: ArraySeparatorStyle): any [static]
- + separatorObjectExplode(style: ObjectSeparatorStyle): any [static]
- + serializeArrayParam({
  allowReserved,
  explode,
  name,
  style,
  value,
}: SerializeOptions<ArraySeparatorStyle> & {
  value: unknown[];
}): any [static]
- + serializePrimitiveParam({
  allowReserved,
  name,
  value,
}: SerializePrimitiveParam): any [static]
- + serializeObjectParam({
  allowReserved,
  explode,
  name,
  style,
  value,
  valueOnly,
}: SerializeOptions<ObjectSeparatorStyle> & {
  value: Record<string, unknown> | Date;
  valueOnly?: boolean;
}): any [static]
Uses: SerializeOptions (parameter, generic), SerializePrimitiveParam (parameter, generic)
Used By: [utils.gen] (calls), SerializeOptions (calls), SerializePrimitiveOptions (calls), SerializerOptions (calls), SerializePrimitiveParam (calls), PathSerializer (calls), [utils.gen] (calls)
---

[queryKeySerializer.gen] (module)
Methods:
- + queryKeyJsonReplacer(_key: string, value: unknown): any [static]
- + stringifyToJsonValue(input: unknown): JsonValue | undefined [static]
- + isPlainObject(value: unknown): value is Record<string, unknown> [static]
- + serializeSearchParams(params: URLSearchParams): JsonValue [static]
- + serializeQueryKeyValue(value: unknown): JsonValue | undefined [static]
---

StreamEvent (interface)
Properties:
- + data: TData
- + event: string
- + id: string
- + retry: number
Uses: Config (imports), Config (imports)
---

[serverSentEvents.gen] (module)
Methods:
- + createSseClient({
  onRequest,
  onSseError,
  onSseEvent,
  responseTransformer,
  responseValidator,
  sseDefaultRetryDelay,
  sseMaxRetryAttempts,
  sseMaxRetryDelay,
  sseSleepFn,
  url,
  ...options
}: ServerSentEventsOptions): ServerSentEventsResult<TData> [static]
Uses: Config (imports), Config (imports)
Used By: [client.gen] (calls)
---

Config (interface)
Properties:
- + auth: ((auth: Auth) => Promise<AuthToken> | AuthToken) | AuthToken
- + bodySerializer: BodySerializer | null
- + headers: | RequestInit['headers']
    | Record<
        string,
        string | number | boolean | (string | number | boolean)[] | null | undefined | unknown
      >
- + method: Uppercase<HttpMethod>
- + querySerializer: QuerySerializer | QuerySerializerOptions
- + requestValidator: (data: unknown) => Promise<unknown>
- + responseTransformer: (data: unknown) => Promise<unknown>
- + responseValidator: (data: unknown) => Promise<unknown>
Uses: Auth (composition, imports), AuthToken (imports), BodySerializer (imports), QuerySerializer (imports), QuerySerializerOptions (imports)
Used By: [client.gen] (parameter, imports, generic), index (re-exports), RequestOptions (implements), [utils.gen] (returns, parameter, imports, generic), [client.gen] (imports), StreamEvent (imports), [serverSentEvents.gen] (imports)
---

PathSerializer (interface)
Properties:
- + path: Record<string, unknown>
- + url: string
Uses: BodySerializer (imports), QuerySerializer (imports), ArraySeparatorStyle (imports), serializeArrayParam (imports), serializeObjectParam (imports), serializePrimitiveParam (imports), [pathSerializer.gen] (calls), [utils.gen] (calls)
Used By: [utils.gen] (parameter, generic)
---

[utils.gen] (module)
Properties:
- + PATH_PARAM_RE: inferred [static] [readonly]
Methods:
- + defaultPathSerializer({ path, url: _url }: PathSerializer): any [static]
- + getUrl({
  baseUrl,
  path,
  query,
  querySerializer,
  url: _url,
}: {
  baseUrl?: string;
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  querySerializer: QuerySerializer;
  url: string;
}): any [static]
- + getValidRequestBody(options: {
  body?: unknown;
  bodySerializer?: BodySerializer | null;
  serializedBody?: unknown;
}): void [static]
Uses: PathSerializer (parameter, generic), BodySerializer (imports), QuerySerializer (imports), ArraySeparatorStyle (imports), serializeArrayParam (imports), serializeObjectParam (imports), serializePrimitiveParam (imports), [pathSerializer.gen] (calls)
Used By: [client.gen] (calls), [utils.gen] (calls), PathSerializer (calls)
---

index (module)
Uses: ItemsService (re-exports), LoginService (re-exports), Options (re-exports), PrivateService (re-exports), UsersService (re-exports), UtilsService (re-exports), Body_login_login_access_token (re-exports), ClientOptions (re-exports), HTTPValidationError (re-exports), ItemCreate (re-exports), ItemPublic (re-exports), itemsCreateItemData (re-exports), itemsCreateItemError (re-exports), itemsCreateItemErrors (re-exports), itemsCreateItemResponse (re-exports), itemsCreateItemResponses (re-exports), itemsDeleteItemData (re-exports), itemsDeleteItemError (re-exports), itemsDeleteItemErrors (re-exports), itemsDeleteItemResponse (re-exports), itemsDeleteItemResponses (re-exports), ItemsPublic (re-exports), itemsReadItemData (re-exports), itemsReadItemError (re-exports), itemsReadItemErrors (re-exports), itemsReadItemResponse (re-exports), itemsReadItemResponses (re-exports), itemsReadItemsData (re-exports), itemsReadItemsError (re-exports), itemsReadItemsErrors (re-exports), itemsReadItemsResponse (re-exports), itemsReadItemsResponses (re-exports), itemsUpdateItemData (re-exports), itemsUpdateItemError (re-exports), itemsUpdateItemErrors (re-exports), itemsUpdateItemResponse (re-exports), itemsUpdateItemResponses (re-exports), ItemUpdate (re-exports), loginLoginAccessTokenData (re-exports), loginLoginAccessTokenError (re-exports), loginLoginAccessTokenErrors (re-exports), loginLoginAccessTokenResponse (re-exports), loginLoginAccessTokenResponses (re-exports), loginRecoverPasswordData (re-exports), loginRecoverPasswordError (re-exports), loginRecoverPasswordErrors (re-exports), loginRecoverPasswordHtmlContentData (re-exports), loginRecoverPasswordHtmlContentError (re-exports), loginRecoverPasswordHtmlContentErrors (re-exports), loginRecoverPasswordHtmlContentResponse (re-exports), loginRecoverPasswordHtmlContentResponses (re-exports), loginRecoverPasswordResponse (re-exports), loginRecoverPasswordResponses (re-exports), loginResetPasswordData (re-exports), loginResetPasswordError (re-exports), loginResetPasswordErrors (re-exports), loginResetPasswordResponse (re-exports), loginResetPasswordResponses (re-exports), loginTestTokenData (re-exports), loginTestTokenResponse (re-exports), loginTestTokenResponses (re-exports), Message (re-exports), NewPassword (re-exports), privateCreateUserData (re-exports), privateCreateUserError (re-exports), privateCreateUserErrors (re-exports), privateCreateUserResponse (re-exports), privateCreateUserResponses (re-exports), PrivateUserCreate (re-exports), Token (re-exports), UpdatePassword (re-exports), UserCreate (re-exports), UserPublic (re-exports), UserRegister (re-exports), usersCreateUserData (re-exports), usersCreateUserError (re-exports), usersCreateUserErrors (re-exports), usersCreateUserResponse (re-exports), usersCreateUserResponses (re-exports), usersDeleteUserData (re-exports), usersDeleteUserError (re-exports), usersDeleteUserErrors (re-exports), usersDeleteUserMeData (re-exports), usersDeleteUserMeResponse (re-exports), usersDeleteUserMeResponses (re-exports), usersDeleteUserResponse (re-exports), usersDeleteUserResponses (re-exports), UsersPublic (re-exports), usersReadUserByIdData (re-exports), usersReadUserByIdError (re-exports), usersReadUserByIdErrors (re-exports), usersReadUserByIdResponse (re-exports), usersReadUserByIdResponses (re-exports), usersReadUserMeData (re-exports), usersReadUserMeResponse (re-exports), usersReadUserMeResponses (re-exports), usersReadUsersData (re-exports), usersReadUsersError (re-exports), usersReadUsersErrors (re-exports), usersReadUsersResponse (re-exports), usersReadUsersResponses (re-exports), usersRegisterUserData (re-exports), usersRegisterUserError (re-exports), usersRegisterUserErrors (re-exports), usersRegisterUserResponse (re-exports), usersRegisterUserResponses (re-exports), usersUpdatePasswordMeData (re-exports), usersUpdatePasswordMeError (re-exports), usersUpdatePasswordMeErrors (re-exports), usersUpdatePasswordMeResponse (re-exports), usersUpdatePasswordMeResponses (re-exports), usersUpdateUserData (re-exports), usersUpdateUserError (re-exports), usersUpdateUserErrors (re-exports), usersUpdateUserMeData (re-exports), usersUpdateUserMeError (re-exports), usersUpdateUserMeErrors (re-exports), usersUpdateUserMeResponse (re-exports), usersUpdateUserMeResponses (re-exports), usersUpdateUserResponse (re-exports), usersUpdateUserResponses (re-exports), UserUpdate (re-exports), UserUpdateMe (re-exports), utilsHealthCheckData (re-exports), utilsHealthCheckResponse (re-exports), utilsHealthCheckResponses (re-exports), utilsTestEmailData (re-exports), utilsTestEmailError (re-exports), utilsTestEmailErrors (re-exports), utilsTestEmailResponse (re-exports), utilsTestEmailResponses (re-exports), ValidationError (re-exports)
---

LoginService
Methods:
- + loginAccessToken(options: Options<loginLoginAccessTokenData, ThrowOnError>): void [static]
- + testToken(options: Options<loginTestTokenData, ThrowOnError>): void [static]
- + recoverPassword(options: Options<loginRecoverPasswordData, ThrowOnError>): void [static]
- + resetPassword(options: Options<loginResetPasswordData, ThrowOnError>): void [static]
- + recoverPasswordHtmlContent(options: Options<loginRecoverPasswordHtmlContentData, ThrowOnError>): void [static]
Uses: Client (imports), Options2 (imports), TDataShape (imports), urlSearchParamsBodySerializer (imports), client (imports), itemsCreateItemData (imports), itemsCreateItemErrors (imports), itemsCreateItemResponses (imports), itemsDeleteItemData (imports), itemsDeleteItemErrors (imports), itemsDeleteItemResponses (imports), itemsReadItemData (imports), itemsReadItemErrors (imports), itemsReadItemResponses (imports), itemsReadItemsData (imports), itemsReadItemsErrors (imports), itemsReadItemsResponses (imports), itemsUpdateItemData (imports), itemsUpdateItemErrors (imports), itemsUpdateItemResponses (imports), loginLoginAccessTokenData (imports), loginLoginAccessTokenErrors (imports), loginLoginAccessTokenResponses (imports), loginRecoverPasswordData (imports), loginRecoverPasswordErrors (imports), loginRecoverPasswordHtmlContentData (imports), loginRecoverPasswordHtmlContentErrors (imports), loginRecoverPasswordHtmlContentResponses (imports), loginRecoverPasswordResponses (imports), loginResetPasswordData (imports), loginResetPasswordErrors (imports), loginResetPasswordResponses (imports), loginTestTokenData (imports), loginTestTokenResponses (imports), privateCreateUserData (imports), privateCreateUserErrors (imports), privateCreateUserResponses (imports), usersCreateUserData (imports), usersCreateUserErrors (imports), usersCreateUserResponses (imports), usersDeleteUserData (imports), usersDeleteUserErrors (imports), usersDeleteUserMeData (imports), usersDeleteUserMeResponses (imports), usersDeleteUserResponses (imports), usersReadUserByIdData (imports), usersReadUserByIdErrors (imports), usersReadUserByIdResponses (imports), usersReadUserMeData (imports), usersReadUserMeResponses (imports), usersReadUsersData (imports), usersReadUsersErrors (imports), usersReadUsersResponses (imports), usersRegisterUserData (imports), usersRegisterUserErrors (imports), usersRegisterUserResponses (imports), usersUpdatePasswordMeData (imports), usersUpdatePasswordMeErrors (imports), usersUpdatePasswordMeResponses (imports), usersUpdateUserData (imports), usersUpdateUserErrors (imports), usersUpdateUserMeData (imports), usersUpdateUserMeErrors (imports), usersUpdateUserMeResponses (imports), usersUpdateUserResponses (imports), utilsHealthCheckData (imports), utilsHealthCheckResponses (imports), utilsTestEmailData (imports), utilsTestEmailErrors (imports), utilsTestEmailResponses (imports)
Used By: index (re-exports), [useAuth] (imports, calls-static)
---

UsersService
Methods:
- + readUsers(options: Options<usersReadUsersData, ThrowOnError>): void [static]
- + createUser(options: Options<usersCreateUserData, ThrowOnError>): void [static]
- + deleteUserMe(options: Options<usersDeleteUserMeData, ThrowOnError>): void [static]
- + readUserMe(options: Options<usersReadUserMeData, ThrowOnError>): void [static]
- + updateUserMe(options: Options<usersUpdateUserMeData, ThrowOnError>): void [static]
- + updatePasswordMe(options: Options<usersUpdatePasswordMeData, ThrowOnError>): void [static]
- + registerUser(options: Options<usersRegisterUserData, ThrowOnError>): void [static]
- + deleteUser(options: Options<usersDeleteUserData, ThrowOnError>): void [static]
- + readUserById(options: Options<usersReadUserByIdData, ThrowOnError>): void [static]
- + updateUser(options: Options<usersUpdateUserData, ThrowOnError>): void [static]
Uses: Client (imports), Options2 (imports), TDataShape (imports), urlSearchParamsBodySerializer (imports), client (imports), itemsCreateItemData (imports), itemsCreateItemErrors (imports), itemsCreateItemResponses (imports), itemsDeleteItemData (imports), itemsDeleteItemErrors (imports), itemsDeleteItemResponses (imports), itemsReadItemData (imports), itemsReadItemErrors (imports), itemsReadItemResponses (imports), itemsReadItemsData (imports), itemsReadItemsErrors (imports), itemsReadItemsResponses (imports), itemsUpdateItemData (imports), itemsUpdateItemErrors (imports), itemsUpdateItemResponses (imports), loginLoginAccessTokenData (imports), loginLoginAccessTokenErrors (imports), loginLoginAccessTokenResponses (imports), loginRecoverPasswordData (imports), loginRecoverPasswordErrors (imports), loginRecoverPasswordHtmlContentData (imports), loginRecoverPasswordHtmlContentErrors (imports), loginRecoverPasswordHtmlContentResponses (imports), loginRecoverPasswordResponses (imports), loginResetPasswordData (imports), loginResetPasswordErrors (imports), loginResetPasswordResponses (imports), loginTestTokenData (imports), loginTestTokenResponses (imports), privateCreateUserData (imports), privateCreateUserErrors (imports), privateCreateUserResponses (imports), usersCreateUserData (imports), usersCreateUserErrors (imports), usersCreateUserResponses (imports), usersDeleteUserData (imports), usersDeleteUserErrors (imports), usersDeleteUserMeData (imports), usersDeleteUserMeResponses (imports), usersDeleteUserResponses (imports), usersReadUserByIdData (imports), usersReadUserByIdErrors (imports), usersReadUserByIdResponses (imports), usersReadUserMeData (imports), usersReadUserMeResponses (imports), usersReadUsersData (imports), usersReadUsersErrors (imports), usersReadUsersResponses (imports), usersRegisterUserData (imports), usersRegisterUserErrors (imports), usersRegisterUserResponses (imports), usersUpdatePasswordMeData (imports), usersUpdatePasswordMeErrors (imports), usersUpdatePasswordMeResponses (imports), usersUpdateUserData (imports), usersUpdateUserErrors (imports), usersUpdateUserMeData (imports), usersUpdateUserMeErrors (imports), usersUpdateUserMeResponses (imports), usersUpdateUserResponses (imports), utilsHealthCheckData (imports), utilsHealthCheckResponses (imports), utilsTestEmailData (imports), utilsTestEmailErrors (imports), utilsTestEmailResponses (imports)
Used By: index (re-exports), [useAuth] (imports, calls-static)
---

UtilsService
Methods:
- + testEmail(options: Options<utilsTestEmailData, ThrowOnError>): void [static]
- + healthCheck(options: Options<utilsHealthCheckData, ThrowOnError>): void [static]
Uses: Client (imports), Options2 (imports), TDataShape (imports), urlSearchParamsBodySerializer (imports), client (imports), itemsCreateItemData (imports), itemsCreateItemErrors (imports), itemsCreateItemResponses (imports), itemsDeleteItemData (imports), itemsDeleteItemErrors (imports), itemsDeleteItemResponses (imports), itemsReadItemData (imports), itemsReadItemErrors (imports), itemsReadItemResponses (imports), itemsReadItemsData (imports), itemsReadItemsErrors (imports), itemsReadItemsResponses (imports), itemsUpdateItemData (imports), itemsUpdateItemErrors (imports), itemsUpdateItemResponses (imports), loginLoginAccessTokenData (imports), loginLoginAccessTokenErrors (imports), loginLoginAccessTokenResponses (imports), loginRecoverPasswordData (imports), loginRecoverPasswordErrors (imports), loginRecoverPasswordHtmlContentData (imports), loginRecoverPasswordHtmlContentErrors (imports), loginRecoverPasswordHtmlContentResponses (imports), loginRecoverPasswordResponses (imports), loginResetPasswordData (imports), loginResetPasswordErrors (imports), loginResetPasswordResponses (imports), loginTestTokenData (imports), loginTestTokenResponses (imports), privateCreateUserData (imports), privateCreateUserErrors (imports), privateCreateUserResponses (imports), usersCreateUserData (imports), usersCreateUserErrors (imports), usersCreateUserResponses (imports), usersDeleteUserData (imports), usersDeleteUserErrors (imports), usersDeleteUserMeData (imports), usersDeleteUserMeResponses (imports), usersDeleteUserResponses (imports), usersReadUserByIdData (imports), usersReadUserByIdErrors (imports), usersReadUserByIdResponses (imports), usersReadUserMeData (imports), usersReadUserMeResponses (imports), usersReadUsersData (imports), usersReadUsersErrors (imports), usersReadUsersResponses (imports), usersRegisterUserData (imports), usersRegisterUserErrors (imports), usersRegisterUserResponses (imports), usersUpdatePasswordMeData (imports), usersUpdatePasswordMeErrors (imports), usersUpdatePasswordMeResponses (imports), usersUpdateUserData (imports), usersUpdateUserErrors (imports), usersUpdateUserMeData (imports), usersUpdateUserMeErrors (imports), usersUpdateUserMeResponses (imports), usersUpdateUserResponses (imports), utilsHealthCheckData (imports), utilsHealthCheckResponses (imports), utilsTestEmailData (imports), utilsTestEmailErrors (imports), utilsTestEmailResponses (imports)
Used By: index (re-exports)
---

ItemsService
Methods:
- + readItems(options: Options<itemsReadItemsData, ThrowOnError>): void [static]
- + createItem(options: Options<itemsCreateItemData, ThrowOnError>): void [static]
- + deleteItem(options: Options<itemsDeleteItemData, ThrowOnError>): void [static]
- + readItem(options: Options<itemsReadItemData, ThrowOnError>): void [static]
- + updateItem(options: Options<itemsUpdateItemData, ThrowOnError>): void [static]
Uses: Client (imports), Options2 (imports), TDataShape (imports), urlSearchParamsBodySerializer (imports), client (imports), itemsCreateItemData (imports), itemsCreateItemErrors (imports), itemsCreateItemResponses (imports), itemsDeleteItemData (imports), itemsDeleteItemErrors (imports), itemsDeleteItemResponses (imports), itemsReadItemData (imports), itemsReadItemErrors (imports), itemsReadItemResponses (imports), itemsReadItemsData (imports), itemsReadItemsErrors (imports), itemsReadItemsResponses (imports), itemsUpdateItemData (imports), itemsUpdateItemErrors (imports), itemsUpdateItemResponses (imports), loginLoginAccessTokenData (imports), loginLoginAccessTokenErrors (imports), loginLoginAccessTokenResponses (imports), loginRecoverPasswordData (imports), loginRecoverPasswordErrors (imports), loginRecoverPasswordHtmlContentData (imports), loginRecoverPasswordHtmlContentErrors (imports), loginRecoverPasswordHtmlContentResponses (imports), loginRecoverPasswordResponses (imports), loginResetPasswordData (imports), loginResetPasswordErrors (imports), loginResetPasswordResponses (imports), loginTestTokenData (imports), loginTestTokenResponses (imports), privateCreateUserData (imports), privateCreateUserErrors (imports), privateCreateUserResponses (imports), usersCreateUserData (imports), usersCreateUserErrors (imports), usersCreateUserResponses (imports), usersDeleteUserData (imports), usersDeleteUserErrors (imports), usersDeleteUserMeData (imports), usersDeleteUserMeResponses (imports), usersDeleteUserResponses (imports), usersReadUserByIdData (imports), usersReadUserByIdErrors (imports), usersReadUserByIdResponses (imports), usersReadUserMeData (imports), usersReadUserMeResponses (imports), usersReadUsersData (imports), usersReadUsersErrors (imports), usersReadUsersResponses (imports), usersRegisterUserData (imports), usersRegisterUserErrors (imports), usersRegisterUserResponses (imports), usersUpdatePasswordMeData (imports), usersUpdatePasswordMeErrors (imports), usersUpdatePasswordMeResponses (imports), usersUpdateUserData (imports), usersUpdateUserErrors (imports), usersUpdateUserMeData (imports), usersUpdateUserMeErrors (imports), usersUpdateUserMeResponses (imports), usersUpdateUserResponses (imports), utilsHealthCheckData (imports), utilsHealthCheckResponses (imports), utilsTestEmailData (imports), utilsTestEmailErrors (imports), utilsTestEmailResponses (imports)
Used By: index (re-exports)
---

PrivateService
Methods:
- + createUser(options: Options<privateCreateUserData, ThrowOnError>): void [static]
Uses: Client (imports), Options2 (imports), TDataShape (imports), urlSearchParamsBodySerializer (imports), client (imports), itemsCreateItemData (imports), itemsCreateItemErrors (imports), itemsCreateItemResponses (imports), itemsDeleteItemData (imports), itemsDeleteItemErrors (imports), itemsDeleteItemResponses (imports), itemsReadItemData (imports), itemsReadItemErrors (imports), itemsReadItemResponses (imports), itemsReadItemsData (imports), itemsReadItemsErrors (imports), itemsReadItemsResponses (imports), itemsUpdateItemData (imports), itemsUpdateItemErrors (imports), itemsUpdateItemResponses (imports), loginLoginAccessTokenData (imports), loginLoginAccessTokenErrors (imports), loginLoginAccessTokenResponses (imports), loginRecoverPasswordData (imports), loginRecoverPasswordErrors (imports), loginRecoverPasswordHtmlContentData (imports), loginRecoverPasswordHtmlContentErrors (imports), loginRecoverPasswordHtmlContentResponses (imports), loginRecoverPasswordResponses (imports), loginResetPasswordData (imports), loginResetPasswordErrors (imports), loginResetPasswordResponses (imports), loginTestTokenData (imports), loginTestTokenResponses (imports), privateCreateUserData (imports), privateCreateUserErrors (imports), privateCreateUserResponses (imports), usersCreateUserData (imports), usersCreateUserErrors (imports), usersCreateUserResponses (imports), usersDeleteUserData (imports), usersDeleteUserErrors (imports), usersDeleteUserMeData (imports), usersDeleteUserMeResponses (imports), usersDeleteUserResponses (imports), usersReadUserByIdData (imports), usersReadUserByIdErrors (imports), usersReadUserByIdResponses (imports), usersReadUserMeData (imports), usersReadUserMeResponses (imports), usersReadUsersData (imports), usersReadUsersErrors (imports), usersReadUsersResponses (imports), usersRegisterUserData (imports), usersRegisterUserErrors (imports), usersRegisterUserResponses (imports), usersUpdatePasswordMeData (imports), usersUpdatePasswordMeErrors (imports), usersUpdatePasswordMeResponses (imports), usersUpdateUserData (imports), usersUpdateUserErrors (imports), usersUpdateUserMeData (imports), usersUpdateUserMeErrors (imports), usersUpdateUserMeResponses (imports), usersUpdateUserResponses (imports), utilsHealthCheckData (imports), utilsHealthCheckResponses (imports), utilsTestEmailData (imports), utilsTestEmailErrors (imports), utilsTestEmailResponses (imports)
Used By: index (re-exports)
---

[AddUser] (module)
Methods:
- + AddUser(): JSX.Element [static]
Uses: UserCreate (imports), UsersService (imports), Button (imports), Checkbox (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DialogTrigger (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
---

DeleteUserProps (interface)
Properties:
- + id: string
- + onSuccess: () => void
Uses: UsersService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
Used By: [DeleteUser] (parameter, generic)
---

[DeleteUser] (module)
Methods:
- + DeleteUser({ id, onSuccess }: DeleteUserProps): JSX.Element [static]
Uses: DeleteUserProps (parameter, generic), UsersService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
---

EditUserProps (interface)
Properties:
- + user: UserPublic
- + onSuccess: () => void
Uses: UserPublic (imports), UsersService (imports), Button (imports), Checkbox (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
Used By: [EditUser] (parameter, generic)
---

[EditUser] (module)
Methods:
- + EditUser({ user, onSuccess }: EditUserProps): JSX.Element [static]
Uses: EditUserProps (parameter, generic), UserPublic (imports), UsersService (imports), Button (imports), Checkbox (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
---

UserActionsMenuProps (interface)
Properties:
- + user: UserPublic
Uses: UserPublic (imports), Button (imports), DropdownMenu (imports), DropdownMenuContent (imports), DropdownMenuTrigger (imports), useAuth (imports), DeleteUser (imports), EditUser (imports)
Used By: [UserActionsMenu] (parameter, generic)
---

[UserActionsMenu] (module)
Methods:
- + UserActionsMenu({ user }: UserActionsMenuProps): JSX.Element [static]
Uses: UserActionsMenuProps (parameter, generic), UserPublic (imports), Button (imports), DropdownMenu (imports), DropdownMenuContent (imports), DropdownMenuTrigger (imports), useAuth (imports), DeleteUser (imports), EditUser (imports)
---

[columns] (module)
Properties:
- + columns: ColumnDef<UserTableData>[] [static] [readonly]
Uses: UserPublic (imports), Badge (imports), cn (imports), UserActionsMenu (imports)
---

[Appearance] (module)
Methods:
- + SidebarAppearance(): JSX.Element [static]
- + Appearance(): JSX.Element [static]
Uses: Theme (imports), useTheme (imports), Button (imports), DropdownMenu (imports), DropdownMenuContent (imports), DropdownMenuItem (imports), DropdownMenuTrigger (imports), SidebarMenuButton (imports), SidebarMenuItem (imports), useSidebar (imports), [sidebar] (calls), [theme-provider] (calls)
---

AuthLayoutProps (interface)
Properties:
- + children: React.ReactNode
Uses: Appearance (imports), Logo (imports), Footer (imports)
Used By: [AuthLayout] (parameter, generic)
---

[AuthLayout] (module)
Methods:
- + AuthLayout({ children }: AuthLayoutProps): void [static]
Uses: AuthLayoutProps (parameter, generic), Appearance (imports), Logo (imports), Footer (imports)
---

DataTableProps (interface)
Properties:
- + columns: ColumnDef<TData, TValue>[]
- + data: TData[]
Uses: Button (imports), Select (imports), SelectContent (imports), SelectItem (imports), SelectTrigger (imports), SelectValue (imports), Table (imports), TableBody (imports), TableCell (imports), TableHead (imports), TableHeader (imports), TableRow (imports)
Used By: [DataTable] (parameter, generic)
---

[DataTable] (module)
Methods:
- + DataTable({
  columns,
  data,
}: DataTableProps<TData, TValue>): void [static]
Uses: DataTableProps (parameter, generic), Button (imports), Select (imports), SelectContent (imports), SelectItem (imports), SelectTrigger (imports), SelectValue (imports), Table (imports), TableBody (imports), TableCell (imports), TableHead (imports), TableHeader (imports), TableRow (imports)
---

[ErrorComponent] (module)
Methods:
- + ErrorComponent(): JSX.Element [static]
Uses: Button (imports)
---

[Footer] (module)
Methods:
- + Footer(): void [static]
---

LogoProps (interface)
Properties:
- + variant: "full" | "icon" | "responsive"
- + className: string
- + asLink: boolean
Uses: useTheme (imports), cn (imports), [theme-provider] (calls)
Used By: [Logo] (parameter, generic)
---

[Logo] (module)
Methods:
- + Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps): void [static]
Uses: LogoProps (parameter, generic), useTheme (imports), cn (imports), [theme-provider] (calls)
---

[NotFound] (module)
Methods:
- + NotFound(): JSX.Element [static]
Uses: Button (imports)
---

[AddItem] (module)
Methods:
- + AddItem(): JSX.Element [static]
Uses: ItemCreate (imports), ItemsService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DialogTrigger (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
---

DeleteItemProps (interface)
Properties:
- + id: string
- + onSuccess: () => void
Uses: ItemsService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
Used By: [DeleteItem] (parameter, generic)
---

[DeleteItem] (module)
Methods:
- + DeleteItem({ id, onSuccess }: DeleteItemProps): JSX.Element [static]
Uses: DeleteItemProps (parameter, generic), ItemsService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
---

EditItemProps (interface)
Properties:
- + item: ItemPublic
- + onSuccess: () => void
Uses: ItemPublic (imports), ItemsService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
Used By: [EditItem] (parameter, generic)
---

[EditItem] (module)
Methods:
- + EditItem({ item, onSuccess }: EditItemProps): JSX.Element [static]
Uses: EditItemProps (parameter, generic), ItemPublic (imports), ItemsService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DropdownMenuItem (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), useCustomToast (imports), handleError (imports)
---

ItemActionsMenuProps (interface)
Properties:
- + item: ItemPublic
Uses: ItemPublic (imports), Button (imports), DropdownMenu (imports), DropdownMenuContent (imports), DropdownMenuTrigger (imports), DeleteItem (imports), EditItem (imports)
Used By: [ItemActionsMenu] (parameter, generic)
---

[ItemActionsMenu] (module)
Methods:
- + ItemActionsMenu({ item }: ItemActionsMenuProps): JSX.Element [static]
Uses: ItemActionsMenuProps (parameter, generic), ItemPublic (imports), Button (imports), DropdownMenu (imports), DropdownMenuContent (imports), DropdownMenuTrigger (imports), DeleteItem (imports), EditItem (imports)
---

[columns] (module)
Properties:
- + columns: ColumnDef<ItemPublic>[] [static] [readonly]
Methods:
- + CopyId({ id }: { id: string }): void [static]
Uses: ItemPublic (imports), Button (imports), useCopyToClipboard (imports), cn (imports), ItemActionsMenu (imports)
---

[PendingItems] (module)
Methods:
- + PendingItems(): JSX.Element [static]
Uses: Skeleton (imports), Table (imports), TableBody (imports), TableCell (imports), TableHead (imports), TableHeader (imports), TableRow (imports)
---

[PendingUsers] (module)
Methods:
- + PendingUsers(): JSX.Element [static]
Uses: Skeleton (imports), Table (imports), TableBody (imports), TableCell (imports), TableHead (imports), TableHeader (imports), TableRow (imports)
---

[AppSidebar] (module)
Methods:
- + AppSidebar(): void [static]
Uses: SidebarAppearance (imports), Logo (imports), Sidebar (imports), SidebarContent (imports), SidebarFooter (imports), SidebarHeader (imports), useAuth (imports), Item (imports), Main (imports), User (imports)
---

MainProps (interface)
Properties:
- + items: Item[]
Uses: SidebarGroup (imports), SidebarGroupContent (imports), SidebarMenu (imports), SidebarMenuButton (imports), SidebarMenuItem (imports), useSidebar (imports), [sidebar] (calls)
Used By: [Main] (parameter, generic)
---

[Main] (module)
Methods:
- + Main({ items }: MainProps): void [static]
Uses: MainProps (parameter, generic), SidebarGroup (imports), SidebarGroupContent (imports), SidebarMenu (imports), SidebarMenuButton (imports), SidebarMenuItem (imports), useSidebar (imports), [sidebar] (calls)
---

UserInfoProps (interface)
Properties:
- + fullName: string
- + email: string
Uses: Avatar (imports), AvatarFallback (imports), DropdownMenu (imports), DropdownMenuContent (imports), DropdownMenuItem (imports), DropdownMenuLabel (imports), DropdownMenuSeparator (imports), DropdownMenuTrigger (imports), SidebarMenu (imports), SidebarMenuButton (imports), SidebarMenuItem (imports), useSidebar (imports), useAuth (imports), getInitials (imports), [sidebar] (calls)
Used By: [User] (parameter, generic)
---

[User] (module)
Methods:
- + UserInfo({ fullName, email }: UserInfoProps): void [static]
- + User({ user }: { user: any }): void [static]
Uses: UserInfoProps (parameter, generic), Avatar (imports), AvatarFallback (imports), DropdownMenu (imports), DropdownMenuContent (imports), DropdownMenuItem (imports), DropdownMenuLabel (imports), DropdownMenuSeparator (imports), DropdownMenuTrigger (imports), SidebarMenu (imports), SidebarMenuButton (imports), SidebarMenuItem (imports), useSidebar (imports), useAuth (imports), getInitials (imports), [sidebar] (calls)
---

[ChangePassword] (module)
Methods:
- + ChangePassword(): JSX.Element [static]
Uses: UpdatePassword (imports), UsersService (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), LoadingButton (imports), PasswordInput (imports), useCustomToast (imports), handleError (imports)
---

[DeleteAccount] (module)
Methods:
- + DeleteAccount(): JSX.Element [static]
Uses: DeleteConfirmation (imports)
---

[DeleteConfirmation] (module)
Methods:
- + DeleteConfirmation(): JSX.Element [static]
Uses: UsersService (imports), Button (imports), Dialog (imports), DialogClose (imports), DialogContent (imports), DialogDescription (imports), DialogFooter (imports), DialogHeader (imports), DialogTitle (imports), DialogTrigger (imports), LoadingButton (imports), useAuth (imports), useCustomToast (imports), handleError (imports)
---

[UserInformation] (module)
Methods:
- + UserInformation(): JSX.Element [static]
Uses: UsersService (imports), UserUpdateMe (imports), Button (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), useAuth (imports), useCustomToast (imports), cn (imports), handleError (imports)
---

[theme-provider] (module)
Methods:
- + ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps): void [static]
- + useTheme(): any [static]
Used By: [Appearance] (calls), LogoProps (calls), [Logo] (calls), [sonner] (calls)
---

[alert] (module)
Methods:
- + Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>): void [static]
- + AlertTitle({ className, ...props }: React.ComponentProps<"div">): void [static]
- + AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">): void [static]
Uses: cn (imports)
---

[avatar] (module)
Methods:
- + Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>): void [static]
- + AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>): void [static]
- + AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>): void [static]
Uses: cn (imports)
---

[badge] (module)
Methods:
- + Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }): void [static]
Uses: cn (imports)
---

[button-group] (module)
Methods:
- + ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>): void [static]
- + ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
}): void [static]
- + ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>): void [static]
Uses: cn (imports), Separator (imports)
---

[button] (module)
Methods:
- + Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }): void [static]
Uses: cn (imports)
---

[card] (module)
Methods:
- + Card({ className, ...props }: React.ComponentProps<"div">): void [static]
- + CardHeader({ className, ...props }: React.ComponentProps<"div">): void [static]
- + CardTitle({ className, ...props }: React.ComponentProps<"div">): void [static]
- + CardDescription({ className, ...props }: React.ComponentProps<"div">): void [static]
- + CardAction({ className, ...props }: React.ComponentProps<"div">): void [static]
- + CardContent({ className, ...props }: React.ComponentProps<"div">): void [static]
- + CardFooter({ className, ...props }: React.ComponentProps<"div">): void [static]
Uses: cn (imports)
---

[checkbox] (module)
Methods:
- + Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>): void [static]
Uses: cn (imports)
---

[dialog] (module)
Methods:
- + Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>): void [static]
- + DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>): void [static]
- + DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>): void [static]
- + DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>): void [static]
- + DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>): void [static]
- + DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}): void [static]
- + DialogHeader({ className, ...props }: React.ComponentProps<"div">): void [static]
- + DialogFooter({ className, ...props }: React.ComponentProps<"div">): void [static]
- + DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>): void [static]
- + DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>): void [static]
Uses: cn (imports)
---

[dropdown-menu] (module)
Methods:
- + DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>): void [static]
- + DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>): void [static]
- + DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>): void [static]
- + DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>): void [static]
- + DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>): void [static]
- + DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
}): void [static]
- + DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>): void [static]
- + DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>): void [static]
- + DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>): void [static]
- + DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}): void [static]
- + DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>): void [static]
- + DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">): void [static]
- + DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>): void [static]
- + DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}): void [static]
- + DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>): void [static]
Uses: cn (imports)
---

[form] (module)
Methods:
- + FormField({
  ...props
}: ControllerProps<TFieldValues, TName>): JSX.Element [static]
- + useFormField(): any [static]
- + FormItem({ className, ...props }: React.ComponentProps<"div">): void [static]
- + FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>): void [static]
- + FormControl({ ...props }: React.ComponentProps<typeof Slot>): void [static]
- + FormDescription({ className, ...props }: React.ComponentProps<"p">): void [static]
- + FormMessage({ className, ...props }: React.ComponentProps<"p">): void [static]
Uses: cn (imports), Label (imports)
---

[input] (module)
Methods:
- + Input({ className, type, ...props }: React.ComponentProps<"input">): void [static]
Uses: cn (imports)
---

[label] (module)
Methods:
- + Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>): void [static]
Uses: cn (imports)
---

ButtonProps (interface)
Implements: React.ButtonHTMLAttributes, VariantProps
Properties:
- + asChild: boolean
- + loading: boolean
Uses: cn (imports)
Used By: [loading-button] (parameter, generic), [Button] (parameter, generic)
---

[loading-button] (module)
Methods:
- + LoadingButton({
  className,
  loading = false,
  children,
  disabled,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps): void [static]
Uses: ButtonProps (parameter, generic), cn (imports)
---

[pagination] (module)
Methods:
- + Pagination({ className, ...props }: React.ComponentProps<"nav">): void [static]
- + PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">): void [static]
- + PaginationItem({ ...props }: React.ComponentProps<"li">): void [static]
- + PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps): void [static]
- + PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>): void [static]
- + PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>): void [static]
- + PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">): void [static]
Uses: cn (imports), Button (imports), buttonVariants (imports)
---

PasswordInputProps (interface)
Implements: React.ComponentProps
Properties:
- + error: string
Uses: cn (imports), Button (imports)
---

[select] (module)
Methods:
- + Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>): void [static]
- + SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>): void [static]
- + SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>): void [static]
- + SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}): void [static]
- + SelectContent({
  className,
  children,
  position = "popper",
  align = "center",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>): void [static]
- + SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>): void [static]
- + SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>): void [static]
- + SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>): void [static]
- + SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>): void [static]
- + SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>): void [static]
Uses: cn (imports)
---

[separator] (module)
Methods:
- + Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>): void [static]
Uses: cn (imports)
---

[sheet] (module)
Methods:
- + Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>): void [static]
- + SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>): void [static]
- + SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>): void [static]
- + SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>): void [static]
- + SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>): void [static]
- + SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
}): void [static]
- + SheetHeader({ className, ...props }: React.ComponentProps<"div">): void [static]
- + SheetFooter({ className, ...props }: React.ComponentProps<"div">): void [static]
- + SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>): void [static]
- + SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>): void [static]
Uses: cn (imports)
---

[sidebar] (module)
Methods:
- + useSidebar(): void [static]
- + SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}): void [static]
- + Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}): void [static]
- + SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>): void [static]
- + SidebarRail({ className, ...props }: React.ComponentProps<"button">): void [static]
- + SidebarInset({ className, ...props }: React.ComponentProps<"main">): void [static]
- + SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>): void [static]
- + SidebarHeader({ className, ...props }: React.ComponentProps<"div">): void [static]
- + SidebarFooter({ className, ...props }: React.ComponentProps<"div">): void [static]
- + SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>): void [static]
- + SidebarContent({ className, ...props }: React.ComponentProps<"div">): void [static]
- + SidebarGroup({ className, ...props }: React.ComponentProps<"div">): void [static]
- + SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }): void [static]
- + SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }): void [static]
- + SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">): void [static]
- + SidebarMenu({ className, ...props }: React.ComponentProps<"ul">): void [static]
- + SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">): void [static]
- + SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>): void [static]
- + SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}): void [static]
- + SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">): void [static]
- + SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}): void [static]
- + SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">): void [static]
- + SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">): void [static]
- + SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}): void [static]
Uses: Button (imports), Input (imports), Separator (imports), Sheet (imports), SheetContent (imports), SheetDescription (imports), SheetHeader (imports), SheetTitle (imports), Skeleton (imports), Tooltip (imports), TooltipContent (imports), TooltipProvider (imports), TooltipTrigger (imports), cn (imports), useIsMobile (imports)
Used By: [Appearance] (calls), MainProps (calls), [Main] (calls), UserInfoProps (calls), [User] (calls)
---

[skeleton] (module)
Methods:
- + Skeleton({ className, ...props }: React.ComponentProps<"div">): void [static]
Uses: cn (imports)
---

[sonner] (module)
Methods:
- + Toaster({ ...props }: ToasterProps): JSX.Element [static]
Uses: useTheme (imports), [theme-provider] (calls)
---

[table] (module)
Methods:
- + Table({ className, ...props }: React.ComponentProps<"table">): void [static]
- + TableHeader({ className, ...props }: React.ComponentProps<"thead">): void [static]
- + TableBody({ className, ...props }: React.ComponentProps<"tbody">): void [static]
- + TableFooter({ className, ...props }: React.ComponentProps<"tfoot">): void [static]
- + TableRow({ className, ...props }: React.ComponentProps<"tr">): void [static]
- + TableHead({ className, ...props }: React.ComponentProps<"th">): void [static]
- + TableCell({ className, ...props }: React.ComponentProps<"td">): void [static]
- + TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">): void [static]
Uses: cn (imports)
---

[tabs] (module)
Methods:
- + Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>): void [static]
- + TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>): void [static]
- + TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>): void [static]
- + TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>): void [static]
Uses: cn (imports)
---

[tooltip] (module)
Methods:
- + TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>): void [static]
- + Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>): void [static]
- + TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>): void [static]
- + TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>): void [static]
Uses: cn (imports)
---

[useAuth] (module)
Methods:
- + isLoggedIn(): any [static]
- + useAuth(): any [static]
Uses: AccessToken (imports), LoginService (imports, calls-static), UserPublic (imports), UserRegister (imports), UsersService (imports, calls-static), handleError (imports), useCustomToast (imports), [useCustomToast] (calls)
---

[useCopyToClipboard] (module)
Methods:
- + useCopyToClipboard(): [CopiedValue, CopyFn] [static]
---

[useCustomToast] (module)
Methods:
- + useCustomToast(): any [static]
Used By: [useAuth] (calls)
---

[useMobile] (module)
Methods:
- + useIsMobile(): void [static]
---

[utils] (module)
Methods:
- + cn(inputs: ClassValue[]): void [static]
---

Register (interface)
Properties:
- + router: typeof router
Uses: client (imports), ThemeProvider (imports), Toaster (imports), routeTree (imports)
---

[main] (module)
Methods:
- + handleApiError(error: Error): any [static]
Uses: client (imports), ThemeProvider (imports), Toaster (imports), routeTree (imports)
---

FileRoutesByFullPath (interface)
Properties:
- + '/': typeof LayoutIndexRoute
- + '/login': typeof LoginRoute
- + '/recover-password': typeof RecoverPasswordRoute
- + '/reset-password': typeof ResetPasswordRoute
- + '/signup': typeof SignupRoute
- + '/admin': typeof LayoutAdminRoute
- + '/items': typeof LayoutItemsRoute
- + '/settings': typeof LayoutSettingsRoute
Uses: rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
Used By: FileRouteTypes (composition)
---

FileRoutesByTo (interface)
Properties:
- + '/login': typeof LoginRoute
- + '/recover-password': typeof RecoverPasswordRoute
- + '/reset-password': typeof ResetPasswordRoute
- + '/signup': typeof SignupRoute
- + '/admin': typeof LayoutAdminRoute
- + '/items': typeof LayoutItemsRoute
- + '/settings': typeof LayoutSettingsRoute
- + '/': typeof LayoutIndexRoute
Uses: rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
Used By: FileRouteTypes (composition)
---

FileRoutesById (interface)
Properties:
- + __root__: typeof rootRouteImport
- + '/_layout': typeof LayoutRouteWithChildren
- + '/login': typeof LoginRoute
- + '/recover-password': typeof RecoverPasswordRoute
- + '/reset-password': typeof ResetPasswordRoute
- + '/signup': typeof SignupRoute
- + '/_layout/admin': typeof LayoutAdminRoute
- + '/_layout/items': typeof LayoutItemsRoute
- + '/_layout/settings': typeof LayoutSettingsRoute
- + '/_layout/': typeof LayoutIndexRoute
Uses: rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
Used By: FileRouteTypes (composition)
---

FileRouteTypes (interface)
Properties:
- + fileRoutesByFullPath: FileRoutesByFullPath
- + fullPaths: | '/'
    | '/login'
    | '/recover-password'
    | '/reset-password'
    | '/signup'
    | '/admin'
    | '/items'
    | '/settings'
- + fileRoutesByTo: FileRoutesByTo
- + to: | '/login'
    | '/recover-password'
    | '/reset-password'
    | '/signup'
    | '/admin'
    | '/items'
    | '/settings'
    | '/'
- + id: | '__root__'
    | '/_layout'
    | '/login'
    | '/recover-password'
    | '/reset-password'
    | '/signup'
    | '/_layout/admin'
    | '/_layout/items'
    | '/_layout/settings'
    | '/_layout/'
- + fileRoutesById: FileRoutesById
Uses: FileRoutesByFullPath (composition), FileRoutesByTo (composition), FileRoutesById (composition), rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
---

RootRouteChildren (interface)
Properties:
- + LayoutRoute: typeof LayoutRouteWithChildren
- + LoginRoute: typeof LoginRoute
- + RecoverPasswordRoute: typeof RecoverPasswordRoute
- + ResetPasswordRoute: typeof ResetPasswordRoute
- + SignupRoute: typeof SignupRoute
Uses: rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
---

FileRoutesByPath (interface)
Properties:
- + '/_layout': {
      id: '/_layout'
      path: ''
      fullPath: '/'
      preLoaderRoute: typeof LayoutRouteImport
      parentRoute: typeof rootRouteImport
    }
- + '/login': {
      id: '/login'
      path: '/login'
      fullPath: '/login'
      preLoaderRoute: typeof LoginRouteImport
      parentRoute: typeof rootRouteImport
    }
- + '/recover-password': {
      id: '/recover-password'
      path: '/recover-password'
      fullPath: '/recover-password'
      preLoaderRoute: typeof RecoverPasswordRouteImport
      parentRoute: typeof rootRouteImport
    }
- + '/reset-password': {
      id: '/reset-password'
      path: '/reset-password'
      fullPath: '/reset-password'
      preLoaderRoute: typeof ResetPasswordRouteImport
      parentRoute: typeof rootRouteImport
    }
- + '/signup': {
      id: '/signup'
      path: '/signup'
      fullPath: '/signup'
      preLoaderRoute: typeof SignupRouteImport
      parentRoute: typeof rootRouteImport
    }
- + '/_layout/': {
      id: '/_layout/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof LayoutIndexRouteImport
      parentRoute: typeof LayoutRoute
    }
- + '/_layout/admin': {
      id: '/_layout/admin'
      path: '/admin'
      fullPath: '/admin'
      preLoaderRoute: typeof LayoutAdminRouteImport
      parentRoute: typeof LayoutRoute
    }
- + '/_layout/items': {
      id: '/_layout/items'
      path: '/items'
      fullPath: '/items'
      preLoaderRoute: typeof LayoutItemsRouteImport
      parentRoute: typeof LayoutRoute
    }
- + '/_layout/settings': {
      id: '/_layout/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof LayoutSettingsRouteImport
      parentRoute: typeof LayoutRoute
    }
Uses: rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
---

LayoutRouteChildren (interface)
Properties:
- + LayoutAdminRoute: typeof LayoutAdminRoute
- + LayoutItemsRoute: typeof LayoutItemsRoute
- + LayoutSettingsRoute: typeof LayoutSettingsRoute
- + LayoutIndexRoute: typeof LayoutIndexRoute
Uses: rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
---

[routeTree.gen] (module)
Properties:
- + routeTree: inferred [static] [readonly]
Uses: rootRouteImport (imports), LayoutRouteImport (imports), LoginRouteImport (imports), RecoverPasswordRouteImport (imports), ResetPasswordRouteImport (imports), SignupRouteImport (imports), LayoutIndexRouteImport (imports), LayoutAdminRouteImport (imports), LayoutItemsRouteImport (imports), LayoutSettingsRouteImport (imports)
---

[__root] (module)
Properties:
- + Route: inferred [static] [readonly]
Uses: ErrorComponent (imports), NotFound (imports)
---

[admin] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + getUsersQueryOptions(): void [static]
- + UsersTableContent(): void [static]
- + UsersTable(): void [static]
- + Admin(): void [static]
Uses: UserPublic (imports), UsersService (imports), AddUser (imports), columns (imports), UserTableData (imports), DataTable (imports), PendingUsers (imports), useAuth (imports)
---

[index] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + Dashboard(): void [static]
Uses: useAuth (imports)
---

[items] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + getItemsQueryOptions(): void [static]
- + ItemsTableContent(): void [static]
- + ItemsTable(): void [static]
- + Items(): void [static]
Uses: ItemsService (imports), DataTable (imports), AddItem (imports), columns (imports), PendingItems (imports)
---

[settings] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + UserSettings(): void [static]
Uses: ChangePassword (imports), DeleteAccount (imports), UserInformation (imports), Tabs (imports), TabsContent (imports), TabsList (imports), TabsTrigger (imports), useAuth (imports)
---

[_layout] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + Layout(): void [static]
Uses: Footer (imports), AppSidebar (imports), SidebarInset (imports), SidebarProvider (imports), SidebarTrigger (imports), isLoggedIn (imports)
---

[login] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + Login(): void [static]
Uses: AccessToken (imports), AuthLayout (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), PasswordInput (imports), isLoggedIn (imports), useAuth (imports)
---

[recover-password] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + RecoverPassword(): void [static]
Uses: LoginService (imports), AuthLayout (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), isLoggedIn (imports), useCustomToast (imports), handleError (imports)
---

[reset-password] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + ResetPassword(): void [static]
Uses: LoginService (imports), AuthLayout (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), LoadingButton (imports), PasswordInput (imports), isLoggedIn (imports), useCustomToast (imports), handleError (imports)
---

[signup] (module)
Properties:
- + Route: inferred [static] [readonly]
Methods:
- + SignUp(): void [static]
Uses: AuthLayout (imports), Form (imports), FormControl (imports), FormField (imports), FormItem (imports), FormLabel (imports), FormMessage (imports), Input (imports), LoadingButton (imports), PasswordInput (imports), isLoggedIn (imports), useAuth (imports)
---

[utils] (module)
Methods:
- + extractErrorMessage(err: Error): string [static]
- + handleError(this: (msg: string) => void, err: Error): any [static]
- + getInitials(name: string): string [static]
---

ImportMetaEnv (interface)
Properties:
- + VITE_API_URL: string
Used By: ImportMeta (composition)
---

ImportMeta (interface)
Properties:
- + env: ImportMetaEnv
Uses: ImportMetaEnv (composition)
---

vite.config (module)
---

[new_account] (module)
Methods:
- + NewAccount({
  project_name = "{{ project_name }}",
  username = "{{ username }}",
  password = "{{ password }}",
  link = "{{ link }}",
}: NewAccountProps): void [static]
Uses: LinkButton (imports), Callout (imports), Detail (imports), Heading (imports), Layout (imports), Link (imports)
---

[reset_password] (module)
Methods:
- + ResetPassword({
  project_name = "{{ project_name }}",
  username = "{{ username }}",
  link = "{{ link }}",
  valid_hours = "{{ valid_hours }}",
}: ResetPasswordProps): void [static]
Uses: LinkButton (imports), Heading (imports), Layout (imports), Link (imports)
---

[Button] (module)
Methods:
- + LinkButton({ children, href }: ButtonProps): JSX.Element [static]
Uses: ButtonProps (parameter, generic)
---

[Callout] (module)
Methods:
- + Callout({ children }: CalloutProps): JSX.Element [static]
- + Detail({ label, value }: DetailProps): JSX.Element [static]
---

[Heading] (module)
Methods:
- + Heading({ children }: HeadingProps): JSX.Element [static]
---

[Layout] (module)
Methods:
- + Layout({
  project_name,
  title,
  preview,
  children,
}: LayoutProps): JSX.Element [static]
---

[Link] (module)
Methods:
- + Link({ children, href }: LinkProps): JSX.Element [static]
---

