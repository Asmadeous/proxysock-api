class CreateUsaEsimCredentials < ActiveRecord::Migration[8.1]
  def up
    execute <<-SQL
      create table public.usa_esim_credentials (
        id uuid not null default gen_random_uuid(),
        iccid text not null,
        qr_activation_code text null,
        qr_code text null,
        zip_code text null,
        provider text not null default 'lyca'::text,
        status text null default 'available'::text,
        order_id uuid null,
        user_id bigint null,
        assigned_at timestamp with time zone null,
        created_at timestamp with time zone null default now(),
        updated_at timestamp with time zone null default now(),
        "PIN1" bigint not null default '1111'::bigint,
        "PIN2" bigint not null default '2222'::bigint,
        "PUK1" bigint not null,
        "PUK2" bigint not null,
        constraint usa_esim_credentials_pkey primary key (id),
        constraint usa_esim_credentials_iccid_key unique (iccid),
        constraint usa_esim_credentials_order_id_fkey foreign KEY (order_id) references usa_esim_orders (id),
        constraint usa_esim_credentials_user_id_fkey foreign KEY (user_id) references users (id),
        constraint usa_esim_credentials_provider_check check (
          (
            provider = any (array['colt'::text, 'lyca'::text])
          )
        ),
        constraint usa_esim_credentials_status_check check (
          (
            status = any (array['available'::text, 'assigned'::text])
          )
        )
      ) TABLESPACE pg_default;

      create index IF not exists usa_esim_credentials_status_idx on public.usa_esim_credentials using btree (status) TABLESPACE pg_default;

      create index IF not exists usa_esim_credentials_provider_idx on public.usa_esim_credentials using btree (provider) TABLESPACE pg_default;
    SQL
  end

  def down
    execute "DROP TABLE public.usa_esim_credentials;"
  end
end
