CREATE DATABASE alexadb
    WITH 
    OWNER = dbmaster
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

CREATE TABLE public.seniors
(
    id_num character varying(256) COLLATE pg_catalog."default" NOT NULL,
    timezone character varying(50) COLLATE pg_catalog."default",
    ccode character varying(20) COLLATE pg_catalog."default",
    CONSTRAINT seniors_pkey PRIMARY KEY (id_num)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.seniors
    OWNER to dbmaster;

CREATE TABLE public.caregivers
(
    care_id character varying(256) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT caregivers_pkey PRIMARY KEY (care_id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.caregivers
    OWNER to dbmaster;

CREATE TABLE public.moods
(
    serial_id integer NOT NULL,
    value character varying(20) COLLATE pg_catalog."default",
    whenwasit timestamp without time zone,
    id_num character varying(256) COLLATE pg_catalog."default",
    sleep character varying(100) COLLATE pg_catalog."default",
    CONSTRAINT moods_pkey PRIMARY KEY (serial_id),
    CONSTRAINT moods_id_num_fkey FOREIGN KEY (id_num)
        REFERENCES public.seniors (id_num) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.moods
    OWNER to dbmaster;

CREATE TABLE public.checkins
(
    serial_id integer NOT NULL,
    id_num character varying(256) COLLATE pg_catalog."default",
    check_in timestamp without time zone,
    check_out timestamp without time zone,
    service_name character varying(40) COLLATE pg_catalog."default",
    duration character varying(20) COLLATE pg_catalog."default",
    CONSTRAINT checkins_pkey PRIMARY KEY (serial_id),
    CONSTRAINT checkins_id_num_fkey FOREIGN KEY (id_num)
        REFERENCES public.seniors (id_num) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.checkins
    OWNER to dbmaster;

CREATE TABLE public.relationship
(
    rel_id integer NOT NULL,
    id_num character varying(256) COLLATE pg_catalog."default",
    care_id character varying(256) COLLATE pg_catalog."default",
    CONSTRAINT relationship_pkey PRIMARY KEY (rel_id),
    CONSTRAINT unique_rows UNIQUE (id_num, care_id),
    CONSTRAINT relationship_care_id_fkey FOREIGN KEY (care_id)
        REFERENCES public.caregivers (care_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT relationship_id_num_fkey FOREIGN KEY (id_num)
        REFERENCES public.seniors (id_num) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.relationship
    OWNER to dbmaster;

CREATE OR REPLACE VIEW public.ccode_rel_view AS
 SELECT relationship.rel_id,
    relationship.id_num,
    relationship.care_id,
    seniors.ccode,
    seniors.timezone
   FROM relationship
     JOIN seniors USING (id_num);

ALTER TABLE public.ccode_rel_view
    OWNER TO dbmaster;

CREATE OR REPLACE VIEW public.senior_check_view AS
 SELECT seniors.id_num,
    seniors.timezone,
    seniors.ccode,
    checkins.serial_id,
    checkins.check_in,
    checkins.check_out,
    checkins.service_name,
    checkins.duration
   FROM seniors
     JOIN checkins USING (id_num);

ALTER TABLE public.senior_check_view
    OWNER TO dbmaster;

CREATE OR REPLACE VIEW public.senior_mood_view AS
 SELECT seniors.id_num,
    seniors.timezone,
    seniors.ccode,
    moods.serial_id,
    moods.value,
    moods.whenwasit,
    moods.sleep
   FROM seniors
     JOIN moods USING (id_num);

ALTER TABLE public.senior_mood_view
    OWNER TO dbmaster;