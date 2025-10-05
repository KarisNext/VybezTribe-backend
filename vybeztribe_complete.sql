--
-- PostgreSQL database dump
--

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ADD THESE DROP STATEMENTS HERE --
DROP TYPE IF EXISTS public.admin_role CASCADE;
DROP TYPE IF EXISTS public.attendance_status CASCADE;
DROP TYPE IF EXISTS public.availability_type CASCADE;
DROP TYPE IF EXISTS public.breaking_priority CASCADE;
DROP TYPE IF EXISTS public.comment_status CASCADE;
DROP TYPE IF EXISTS public.donation_status CASCADE;
DROP TYPE IF EXISTS public.media_type CASCADE;
DROP TYPE IF EXISTS public.news_status CASCADE;
DROP TYPE IF EXISTS public.notification_priority CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;
DROP TYPE IF EXISTS public.payment_method CASCADE;
DROP TYPE IF EXISTS public.reaction_type CASCADE;
DROP TYPE IF EXISTS public.referral_status CASCADE;
DROP TYPE IF EXISTS public.share_platform CASCADE;
DROP TYPE IF EXISTS public.subscriber_status CASCADE;
DROP TYPE IF EXISTS public.target_type CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.volunteer_status CASCADE;

--
-- Name: admin_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_role AS ENUM (
    'super_admin',
    'admin',
    'editor',
    'moderator'
);

-- Continue with the rest of your file...

-- 

--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendance_status AS ENUM (
    'registered',
    'attended',
    'cancelled',
    'no_show'
);




--
-- Name: availability_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.availability_type AS ENUM (
    'weekdays',
    'weekends',
    'both',
    'flexible'
);




--
-- Name: breaking_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.breaking_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);




--
-- Name: comment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.comment_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'spam'
);




--
-- Name: donation_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.donation_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);




--
-- Name: media_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.media_type AS ENUM (
    'image',
    'video',
    'document'
);




--
-- Name: news_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.news_status AS ENUM (
    'draft',
    'published',
    'archived'
);




--
-- Name: notification_priority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);




--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notification_type AS ENUM (
    'new_user',
    'new_comment',
    'content_report',
    'system_alert',
    'breaking_news',
    'donation_received'
);




--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'mpesa',
    'card',
    'paypal',
    'bank'
);




--
-- Name: reaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.reaction_type AS ENUM (
    'like'
);




--
-- Name: referral_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.referral_status AS ENUM (
    'pending',
    'completed',
    'expired'
);




--
-- Name: share_platform; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.share_platform AS ENUM (
    'facebook',
    'twitter',
    'linkedin',
    'whatsapp',
    'telegram',
    'email',
    'copy'
);




--
-- Name: subscriber_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.subscriber_status AS ENUM (
    'active',
    'inactive',
    'pending'
);




--
-- Name: target_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.target_type AS ENUM (
    'news',
    'user',
    'comment',
    'category',
    'system',
    'settings'
);




--
-- Name: user_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'suspended',
    'deactivated'
);




--
-- Name: volunteer_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.volunteer_status AS ENUM (
    'active',
    'inactive',
    'pending'
);




--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;



SET default_tablespace = '';

-- SET default_table_access_method = heap;

--
-- Name: activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_log (
    activity_id integer NOT NULL,
    user_id integer,
    admin_id integer,
    action character varying(255) NOT NULL,
    details text,
    ip_address inet,
    user_agent character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);



--
-- Name: activity_log_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_log_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_log_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_log_activity_id_seq OWNED BY public.activity_log.activity_id;


--
-- Name: admin_activity_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_activity_log (
    log_id integer NOT NULL,
    admin_id integer NOT NULL,
    action character varying(100) NOT NULL,
    target_type public.target_type NOT NULL,
    target_id integer,
    details text,
    ip_address inet,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_activity_log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_activity_log_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_activity_log_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_activity_log_log_id_seq OWNED BY public.admin_activity_log.log_id;


--
-- Name: breaking_news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.breaking_news (
    breaking_id integer NOT NULL,
    news_id integer NOT NULL,
    priority public.breaking_priority DEFAULT 'medium'::public.breaking_priority,
    display_until timestamp without time zone,
    active boolean DEFAULT true,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: donations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.donations (
    donation_id integer NOT NULL,
    user_id integer,
    donor_name character varying(200),
    donor_email character varying(150),
    amount numeric(10,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    transaction_ref character varying(100),
    status public.donation_status DEFAULT 'pending'::public.donation_status,
    donated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news (
    news_id integer NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    excerpt text,
    slug character varying(200),
    category_id integer,
    featured boolean DEFAULT false,
    featured_until timestamp without time zone,
    image_url character varying(500),
    views integer DEFAULT 0,
    status public.news_status DEFAULT 'draft'::public.news_status,
    tags text,
    meta_description text,
    seo_keywords text,
    reading_time integer,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    author_id integer,
    published_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    youtube_url character varying(500),
    youtube_id character varying(50),
    youtube_title character varying(200),
    youtube_thumbnail character varying(500),
    share_count integer DEFAULT 0,
    priority character varying(10) DEFAULT 'medium'::character varying,
    processed_content text,
    quotes_data jsonb,
    CONSTRAINT news_priority_check CHECK (((priority)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'short'::character varying])::text[])))
);


--
-- Name: COLUMN news.processed_content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.news.processed_content IS 'HTML-processed content where [QUOTE]...[/QUOTE] is replaced with <blockquote>';


--
-- Name: COLUMN news.quotes_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.news.quotes_data IS 'JSON array of extracted quotes with their text and optional metadata';


--
-- Name: news_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_comments (
    comment_id integer NOT NULL,
    news_id integer NOT NULL,
    user_id integer,
    author_name character varying(100),
    author_email character varying(150),
    comment_text text NOT NULL,
    parent_id integer,
    status public.comment_status DEFAULT 'pending'::public.comment_status,
    ip_address inet,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: subscribers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscribers (
    subscriber_id integer NOT NULL,
    email character varying(150) NOT NULL,
    name character varying(200),
    status public.subscriber_status DEFAULT 'pending'::public.subscriber_status,
    preferences jsonb,
    subscribed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    confirmed_at timestamp without time zone,
    unsubscribed_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20) NOT NULL,
    county character varying(100) NOT NULL,
    constituency character varying(100),
    referral_code character varying(50),
    referred_by integer,
    volunteer_interest boolean DEFAULT false,
    sms_updates boolean DEFAULT false,
    email_verified boolean DEFAULT false,
    phone_verified boolean DEFAULT false,
    password_hash character varying(255),
    last_login timestamp without time zone,
    status public.user_status DEFAULT 'active'::public.user_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: volunteers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.volunteers (
    volunteer_id integer NOT NULL,
    full_name character varying(200) NOT NULL,
    nickname character varying(100),
    phone character varying(20) NOT NULL,
    email character varying(150),
    county character varying(100) NOT NULL,
    constituency character varying(100),
    expertise character varying(200),
    availability public.availability_type DEFAULT 'flexible'::public.availability_type,
    status public.volunteer_status DEFAULT 'pending'::public.volunteer_status,
    assigned_tasks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_dashboard_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.admin_dashboard_stats AS
 SELECT ( SELECT count(*) AS count
           FROM public.news
          WHERE (news.status = 'published'::public.news_status)) AS published_articles,
    ( SELECT count(*) AS count
           FROM public.news
          WHERE (news.status = 'draft'::public.news_status)) AS draft_articles,
    ( SELECT count(*) AS count
           FROM public.news
          WHERE (news.created_at >= (CURRENT_TIMESTAMP - '24:00:00'::interval))) AS articles_today,
    ( SELECT count(*) AS count
           FROM public.users
          WHERE (users.created_at >= (CURRENT_TIMESTAMP - '7 days'::interval))) AS new_users_week,
    ( SELECT count(*) AS count
           FROM public.news_comments
          WHERE (news_comments.status = 'pending'::public.comment_status)) AS pending_comments,
    ( SELECT count(*) AS count
           FROM public.breaking_news
          WHERE (breaking_news.active = true)) AS active_breaking_news,
    ( SELECT COALESCE(sum(news.views), (0)::bigint) AS "coalesce"
           FROM public.news) AS total_views,
    ( SELECT count(*) AS count
           FROM public.subscribers
          WHERE (subscribers.status = 'active'::public.subscriber_status)) AS active_subscribers,
    ( SELECT count(*) AS count
           FROM public.volunteers
          WHERE (volunteers.status = 'active'::public.volunteer_status)) AS active_volunteers,
    ( SELECT count(*) AS count
           FROM public.donations
          WHERE (donations.status = 'completed'::public.donation_status)) AS completed_donations;



--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    notification_id integer NOT NULL,
    admin_id integer,
    type public.notification_type NOT NULL,
    title character varying(200) NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false,
    priority public.notification_priority DEFAULT 'medium'::public.notification_priority,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: admin_notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: admin_notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notifications_notification_id_seq OWNED BY public.admin_notifications.notification_id;


--
-- Name: admin_session_store; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_session_store (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_sessions (
    session_id character varying(128) NOT NULL,
    admin_id integer NOT NULL,
    ip_address inet,
    user_agent character varying(500),
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true
);


--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    admin_id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    phone character varying(20) NOT NULL,
    role public.admin_role DEFAULT 'admin'::public.admin_role,
    password_hash character varying(255) NOT NULL,
    permissions jsonb,
    last_login timestamp without time zone,
    status public.user_status DEFAULT 'active'::public.user_status,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    username character varying(50)
);


--
-- Name: admins_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admins_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admins_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admins_admin_id_seq OWNED BY public.admins.admin_id;


--
-- Name: breaking_news_breaking_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.breaking_news_breaking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: breaking_news_breaking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.breaking_news_breaking_id_seq OWNED BY public.breaking_news.breaking_id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    color character varying(7),
    icon character varying(50),
    order_index integer DEFAULT 0,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- Name: donations_donation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.donations_donation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: donations_donation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.donations_donation_id_seq OWNED BY public.donations.donation_id;


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event_registrations (
    registration_id integer NOT NULL,
    event_id integer NOT NULL,
    user_id integer,
    name character varying(200),
    email character varying(150),
    phone character varying(20),
    attendance_status public.attendance_status DEFAULT 'registered'::public.attendance_status,
    registered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: event_registrations_registration_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_registrations_registration_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_registrations_registration_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_registrations_registration_id_seq OWNED BY public.event_registrations.registration_id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    event_id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    event_date date NOT NULL,
    event_time time without time zone,
    location character varying(200),
    image_url character varying(500),
    max_attendees integer,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: events_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.events_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.events_event_id_seq OWNED BY public.events.event_id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    media_id integer NOT NULL,
    user_id integer,
    admin_id integer,
    file_path character varying(255) NOT NULL,
    file_name character varying(255),
    file_size integer,
    media_type public.media_type NOT NULL,
    caption text,
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: media_media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: media_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_media_id_seq OWNED BY public.media.media_id;


--
-- Name: news_comments_comment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_comments_comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_comments_comment_id_seq OWNED BY public.news_comments.comment_id;


--
-- Name: news_news_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_news_id_seq OWNED BY public.news.news_id;


--
-- Name: news_reactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_reactions (
    reaction_id integer NOT NULL,
    news_id integer NOT NULL,
    user_id integer,
    reaction_type public.reaction_type DEFAULT 'like'::public.reaction_type,
    ip_address inet,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: news_reactions_reaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_reactions_reaction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_reactions_reaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_reactions_reaction_id_seq OWNED BY public.news_reactions.reaction_id;


--
-- Name: news_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news_shares (
    share_id integer NOT NULL,
    news_id integer NOT NULL,
    platform public.share_platform NOT NULL,
    user_id integer,
    ip_address inet,
    shared_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: news_shares_share_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_shares_share_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: news_shares_share_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_shares_share_id_seq OWNED BY public.news_shares.share_id;


--
-- Name: referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referrals (
    referral_id integer NOT NULL,
    referrer_id integer NOT NULL,
    referred_id integer NOT NULL,
    status public.referral_status DEFAULT 'pending'::public.referral_status,
    reward_given boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: referrals_referral_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.referrals_referral_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referrals_referral_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.referrals_referral_id_seq OWNED BY public.referrals.referral_id;


--
-- Name: subscribers_subscriber_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscribers_subscriber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscribers_subscriber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscribers_subscriber_id_seq OWNED BY public.subscribers.subscriber_id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    tag_id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    usage_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

--
-- Name: tags_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tags_tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

--
-- Name: tags_tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tags_tag_id_seq OWNED BY public.tags.tag_id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    session_id character varying(128) NOT NULL,
    user_id integer NOT NULL,
    ip_address inet,
    user_agent character varying(255),
    last_activity timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true
);


--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: volunteers_volunteer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.volunteers_volunteer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: volunteers_volunteer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.volunteers_volunteer_id_seq OWNED BY public.volunteers.volunteer_id;


--
-- Name: activity_log activity_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log ALTER COLUMN activity_id SET DEFAULT nextval('public.activity_log_activity_id_seq'::regclass);


--
-- Name: admin_activity_log log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_activity_log ALTER COLUMN log_id SET DEFAULT nextval('public.admin_activity_log_log_id_seq'::regclass);


--
-- Name: admin_notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.admin_notifications_notification_id_seq'::regclass);


--
-- Name: admins admin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins ALTER COLUMN admin_id SET DEFAULT nextval('public.admins_admin_id_seq'::regclass);


--
-- Name: breaking_news breaking_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.breaking_news ALTER COLUMN breaking_id SET DEFAULT nextval('public.breaking_news_breaking_id_seq'::regclass);


--
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- Name: donations donation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations ALTER COLUMN donation_id SET DEFAULT nextval('public.donations_donation_id_seq'::regclass);


--
-- Name: event_registrations registration_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registrations ALTER COLUMN registration_id SET DEFAULT nextval('public.event_registrations_registration_id_seq'::regclass);


--
-- Name: events event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events ALTER COLUMN event_id SET DEFAULT nextval('public.events_event_id_seq'::regclass);


--
-- Name: media media_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media ALTER COLUMN media_id SET DEFAULT nextval('public.media_media_id_seq'::regclass);


--
-- Name: news news_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news ALTER COLUMN news_id SET DEFAULT nextval('public.news_news_id_seq'::regclass);


--
-- Name: news_comments comment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_comments ALTER COLUMN comment_id SET DEFAULT nextval('public.news_comments_comment_id_seq'::regclass);


--
-- Name: news_reactions reaction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_reactions ALTER COLUMN reaction_id SET DEFAULT nextval('public.news_reactions_reaction_id_seq'::regclass);


--
-- Name: news_shares share_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_shares ALTER COLUMN share_id SET DEFAULT nextval('public.news_shares_share_id_seq'::regclass);


--
-- Name: referrals referral_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals ALTER COLUMN referral_id SET DEFAULT nextval('public.referrals_referral_id_seq'::regclass);


--
-- Name: subscribers subscriber_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers ALTER COLUMN subscriber_id SET DEFAULT nextval('public.subscribers_subscriber_id_seq'::regclass);


--
-- Name: tags tag_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags ALTER COLUMN tag_id SET DEFAULT nextval('public.tags_tag_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Name: volunteers volunteer_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteers ALTER COLUMN volunteer_id SET DEFAULT nextval('public.volunteers_volunteer_id_seq'::regclass);


--
-- Data for Name: activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admin_activity_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.admin_activity_log VALUES (1, 3, 'publish_news', 'news', 4, 'Published news: CHAPTER ONE: INTRODUCTION', '::1', '2025-09-15 21:27:50.084795');
INSERT INTO public.admin_activity_log VALUES (2, 3, 'publish_news', 'news', 5, 'Published news: CHAPTER ONE: INTRODUCTION 1.0 Introduction', '::1', '2025-09-15 21:37:38.22282');
INSERT INTO public.admin_activity_log VALUES (3, 3, 'publish_news', 'news', 6, 'Published news: Domain Name System (DNS), focusing on its design, operational mechanisms,', '::1', '2025-09-16 20:28:28.688266');
INSERT INTO public.admin_activity_log VALUES (4, 3, 'publish_news', 'news', 7, 'Published news: originally designed with security in mind, leading to inherent technological vulnerabilities', '::1', '2025-09-16 20:31:44.234869');
INSERT INTO public.admin_activity_log VALUES (5, 3, 'publish_news', 'news', 8, 'Published news: Traditional DNS infrastructures do not inherently track Media Access Control (MAC)', '::1', '2025-09-16 20:33:37.150198');
INSERT INTO public.admin_activity_log VALUES (6, 3, 'publish_news', 'news', 9, 'Published news:  Rogue DNS Servers', '::1', '2025-09-16 20:49:17.486514');
INSERT INTO public.admin_activity_log VALUES (7, 3, 'publish_news', 'news', 10, 'Published news: CHAPTER 1: INTRODUCTION 1.1 Synopsis  While universities work towards improving instructional approaches', '::1', '2025-09-17 22:31:03.507171');
INSERT INTO public.admin_activity_log VALUES (8, 3, 'publish_news', 'news', 11, 'Published news:  Data Verification ', '::1', '2025-09-17 22:35:22.384998');
INSERT INTO public.admin_activity_log VALUES (9, 3, 'publish_news', 'news', 12, 'Published news: 2.3 Empirical Evidence of the Research Questions ', '::1', '2025-09-18 12:57:19.765206');
INSERT INTO public.admin_activity_log VALUES (10, 3, 'publish_news', 'news', 13, 'Published news: CHAPTER III: METHODOLOGY Research Design', '::1', '2025-09-18 13:54:51.61376');


--
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admin_session_store; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.admin_session_store VALUES ('6aV304StZJM7_4jjTm9WgRpbP-8gzh1w', '{"cookie":{"originalMaxAge":28800000,"expires":"2025-09-30T23:03:09.940Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"adminId":3,"loginTime":"2025-09-30T15:03:09.849Z"}', '2025-10-01 02:20:07');


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.admins VALUES (4, 'Rahab', 'Waithera', 'sera@vybeztribe.com', '+254795785304', 'admin', '$2b$12$rYCBO.fuZ87LQvFiV0fclukl5RLf66HeKZsmT3dJN/bvRDoUPy0Nu', '["manage_news", "manage_categories", "manage_comments", "view_analytics"]', '2025-09-26 21:41:23.7003', 'active', '2025-09-21 16:35:52.803218', '2025-09-26 21:41:23.7003', 'sera');
INSERT INTO public.admins VALUES (1, 'VybezTribe', 'Admin', 'admin@vybeztribe.co.ke', '+254700000001', 'super_admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '["all"]', NULL, 'active', '2025-09-11 14:18:48.187916', '2025-09-27 21:16:20.314108', 'admin');
INSERT INTO public.admins VALUES (2, 'News', 'Editor', 'editor@vybeztribe.co.ke', '+254700000002', 'editor', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '["manage_news", "manage_categories", "manage_comments"]', NULL, 'active', '2025-09-11 14:18:48.187916', '2025-09-27 21:16:20.314108', 'editor');
INSERT INTO public.admins VALUES (3, 'Elijah', 'Kariuki', 'elijah@vybeztribe.com', '+254720758470', 'super_admin', '$2b$12$CnhZU.ulCYNQfTJ/uox1gOhY3wj1MmLSC1l7fPnkpKeKyvnvG886e', '["all"]', '2025-09-30 18:03:09.856413', 'active', '2025-09-14 09:52:04.847877', '2025-09-30 18:03:09.856413', 'karis');
INSERT INTO public.admins VALUES (5, 'Geneive', 'Hildah', 'geneive@vybeztribe.com', '0711358798', 'editor', '$2b$12$9ChPHFDx.9WQIno5r4OTmeH5wBqPOXK1t2VZ9inssAi3kVNaHl0lW', NULL, NULL, 'active', '2025-09-30 18:05:46.28117', '2025-09-30 18:05:46.28117', NULL);


--
-- Data for Name: breaking_news; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.categories VALUES (1, 'Politics', 'politics', 'Progressive politics and social democracy', '#2e8b57', 'politics', 1, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (2, 'Business', 'business', 'People-centered business news', '#1a365d', 'business', 2, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (3, 'Economy', 'economy', 'Economic justice and policy', '#dc143c', 'economy', 3, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (4, 'Investments', 'investments', 'Smart investment insights', '#d4af37', 'investments', 4, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (5, 'Culture', 'culture', 'Kenyan culture and society', '#8b4513', 'culture', 5, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (6, 'Travel', 'travel', 'Local and sustainable travel', '#2d3748', 'travel', 6, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (8, 'International', 'international', 'News and analysis from around the world', '#004c99', 'globe', 8, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (9, 'County', 'county', 'Local news and events from across all counties', '#7f00ff', 'map-marker-alt', 9, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (10, 'Legal', 'legal', 'Updates and insights on legal matters', '#40e0d0', 'balance-scale', 10, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (11, 'Sports', 'sports', 'Latest sports news, scores, and highlights', '#ff4500', 'futbol', 11, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (12, 'Health', 'health', 'Wellness tips, health trends, and medical news', '#3cb371', 'heartbeat', 12, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (13, 'Technology', 'technology', 'Tech innovations and digital trends', '#6a5acd', 'microchip', 13, true, '2025-09-11 14:18:48.136653', '2025-09-11 14:18:48.136653');
INSERT INTO public.categories VALUES (7, 'Arts', 'arts', 'Arts, creativity, and expression', '#6b46c1', 'arts', 7, false, '2025-09-11 14:18:48.136653', '2025-09-27 21:31:00.367404');
INSERT INTO public.categories VALUES (14, 'Opinion', 'opinion', 'Commentary and perspectives on current events and issues', '#ffa500', 'opinion', 7, true, '2025-09-27 21:31:00.367404', '2025-09-27 21:31:00.367404');
INSERT INTO public.categories VALUES (15, 'Quotes', 'quotes', 'Special category for featured quotes and highlighted statements', '#4b0082', 'quote', 8, true, '2025-09-28 10:15:32.26648', '2025-09-28 10:15:32.26648');
INSERT INTO public.categories VALUES (16, 'Counties', 'counties', 'News and updates from counties across Kenya', '#16a34a', 'county', 2, true, '2025-09-30 15:12:10.086185', '2025-09-30 15:12:10.086185');
INSERT INTO public.categories VALUES (17, 'National News', 'national', 'National news coverage from across Kenya', '#dc2626', 'national', 1, true, '2025-09-30 16:09:41.646591', '2025-09-30 16:09:41.646591');


--
-- Data for Name: donations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.news VALUES (2, 'Economic Justice: A Path Forward for Kenya', 'Kenya stands at a crossroads. The choice between continued inequality or a progressive path toward economic justice will define our future...', 'Exploring pathways to economic justice and equitable development in Kenya', 'economic-justice-path-forward', 3, false, NULL, NULL, 0, 'published', 'economy,justice,development', NULL, 'kenya economy, economic justice, development', 7, 0, 0, 1, '2025-09-11 14:18:48.211378', '2025-09-11 14:18:48.211378', '2025-09-11 14:18:48.211378', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);
INSERT INTO public.news VALUES (3, 'Celebrating Kenyan Culture: Our Rich Heritage', 'From the highlands of Mount Kenya to the shores of the Indian Ocean, Kenya''s cultural diversity is our greatest strength...', 'A celebration of Kenya''s rich cultural heritage and diversity', 'celebrating-kenyan-culture', 5, false, NULL, NULL, 0, 'published', 'culture,heritage,diversity', NULL, 'kenyan culture, heritage, diversity', 4, 0, 0, 1, '2025-09-11 14:18:48.211378', '2025-09-11 14:18:48.211378', '2025-09-11 14:18:48.211378', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);
INSERT INTO public.news VALUES (13, 'CHAPTER III: METHODOLOGY Research Design', 'CHAPTER III: METHODOLOGY
3.1 Research Design
This study employs a systematic literature review methodology to synthesize existing research on instructional leadership and teacher development within Kenyan Grade system educational contexts. Systematic literature reviews represent the gold standard for evidence synthesis in educational research, providing a rigorous, transparent, and reproducible approach to knowledge consolidation (Gough et al., 2017). Unlike traditional narrative reviews that may be subject to selection bias and subjective interpretation, systematic reviews follow pre-established protocols that minimize bias while maximizing the comprehensiveness and reliability of findings.
The systematic review methodology was selected for several compelling reasons. First, it enables comprehensive identification and evaluation of all relevant empirical studies addressing the research questions through systematic database searching and explicit inclusion criteria. Second, it provides a transparent and reproducible framework through detailed protocols that can be replicated by other researchers. Third, it incorporates critical appraisal of study quality to ensure that conclusions are based on robust evidence rather than methodologically flawed research. Fourth, it facilitates structured synthesis of diverse evidence types, allowing for identification of patterns, contradictions, and gaps in the literature that inform both theory and practice.
This methodology aligns with established international standards for educational research synthesis and enables the development of evidence-based recommendations for instructional leadership practice. The systematic approach is particularly valuable in the field of educational leadership, where practitioners require reliable evidence to guide decision-making and policy development. By synthesizing findings from multiple high-quality studies, systematic reviews provide more robust conclusions than individual primary studies and can identify factors that contribute to effectiveness across different contexts.
The research design incorporates both qualitative and quantitative evidence synthesis techniques, recognizing that instructional leadership research employs diverse methodological approaches. This mixed-methods synthesis approach enables comprehensive understanding of both the effectiveness of instructional leadership practices (through quantitative evidence) and the mechanisms and contextual factors that influence their implementation (through qualitative evidence).
3.2 Research Philosophy and Theoretical Framework
This systematic review adopts a pragmatic research philosophy, which acknowledges that knowledge about instructional leadership and teacher development can be generated through multiple epistemological approaches. Pragmatism is particularly appropriate for systematic reviews because it allows for the integration of findings from studies employing different philosophical foundations, methodological approaches, and analytical techniques (Creswell & Plano Clark, 2017).
The pragmatic approach recognizes that instructional leadership is a complex phenomenon that operates within dynamic educational systems and cannot be fully understood through a single epistemological lens. This philosophy supports the integration of both positivist research (emphasizing measurable outcomes and causal relationships) and interpretivist research (focusing on subjective experiences and contextual understanding). By adopting a pragmatic stance, the review can synthesize quantitative studies that examine statistical relationships between instructional leadership practices and teacher/student outcomes, alongside qualitative studies that explore the lived experiences of educators and the contextual factors that shape leadership effectiveness.
The theoretical framework guiding this review draws from multiple instructional leadership models, including Hallinger''s (2003) model of instructional leadership dimensions, which encompasses defining the school mission, managing the instructional program, and promoting a positive school learning climate. Additionally, the review incorporates contemporary distributed leadership theory (Spillane, 2006), which recognizes that instructional leadership involves multiple actors and occurs through various organizational structures and processes.
', 'This study employs a systematic literature review methodology to synthesize existing research on instructional leadership and teacher development within Kenyan Grade system educational contexts. Systematic literature reviews represent the gold standard for evidence synthesis in educational research, providing a rigorous, transparent, and reproducible approach to knowledge consolidation (Gough et al., 2017). Unlike traditional narrative reviews that may be subject to selection bias and subjective', 'chapter-iii-methodology-research-design', 1, true, '2025-09-25 13:54:51.528', NULL, 89, 'published', 'about instructional leadership and teacher development', 'Second, it provides a transparent and reproducible framework through detailed protocols that can be replicated by other researchers. Third, it incorporates crit', 'about instructional leadership and teacher development', 3, 0, 0, 3, '2025-09-18 13:54:51.528', '2025-09-18 13:54:51.529669', '2025-09-30 19:05:22.370003', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);
INSERT INTO public.news VALUES (8, 'Traditional DNS infrastructures do not inherently track Media Access Control (MAC)', '2.2.8 Limited Scope Definition
Given that improperly configured access controls, excessive zone transfers, and improper delegation of authority contribute to data integrity risks and service disruptions (Saidi et al. 2022), DNS''s hierarchical structure and zone and record configuration errors frequently result in security flaws that let attackers alter DNS records or obtain unauthorized access (Grimes, 2022). According to studies, companies with loose DNS rules are more vulnerable to cache poisoning and subdomain hijacking attacks because hackers can introduce phony replies by taking advantage of ill-defined boundaries (Jeitner and Schulman, 2021). Additionally, extensive DNS configuration errors have been linked to the disclosure of private company information, demonstrating automated policy enforcement and real-time auditing systems (Lyu, 2021).
2.2.9 MAC Address Limitations
Traditional DNS infrastructures do not inherently track Media Access Control (MAC) addresses, making it difficult to validate client devices and enforce strict identity verification measures (Schmid, 2021 and Ayoub, 2024). This limitation weakens the ability of DNS-based security mechanisms to distinguish between legitimate and spoofed devices, particularly in dynamic network environments (Díaz-Sánchez et al. 2019). Research indicates that attackers frequently exploit this gap in enterprise networks by leveraging unauthorized access points and rogue devices, bypassing DNS-based security policies (van Oorschot et al. 2021). As such, Implementing integrated DNS and network access control (NAC) solutions has been proposed as a mitigation strategy, allowing for cross-verification of MAC addresses with DNS query activity to strengthen endpoint security (Anagnostis et al. 2024).
2.2.10 MAC Spoofing and Static IP Assignment
Attackers often bypass DNS security controls by assigning static IP addresses or using MAC spoofing techniques to impersonate trusted devices (Naeem et al. 2024, p. 167) ensuring gain unauthorized access, conduct reconnaissance, and escalate privileges within a network. Ideally, threat actors employ MAC spoofing to evade network-based anomaly detection systems, making it challenging to trace malicious activities back to their true origin (Jeffrey et al. 2023). Some advanced threat detection solutions now incorporate behavioral analytics and AI-driven profiling to detect inconsistencies in device activity, improving the ability to identify spoofed devices in real time (Ramos et al. 2025 and Owen and White, 2024) where such solutions require continuous refinement to reduce false positives and adapt to evolving attack methodologies (Majumder et al. 2025, p. 741).
2.3 Anomalies 
Due to the operative nature of the DNS as detailed above, vulnerabilities and security measures often arise most popular pones including cache poisoning, denial-of-service (DoS), tunnelling, hijacking, and domain-based phishing being some of the setbacks that DNS vulnerabilities surface.  Considering most DNS based detection, traditional DNS security solutions operate in firewalls and intrusion detection systems not marching these changing threats (Wang et al. 2021). By engaging cryptographic nature with a view of guaranteeing data integrity and authenticity, one viewpoint is that DNS Security ', 'Traditional DNS infrastructures do not inherently track Media Access Control (MAC) addresses, making it difficult to validate client devices and enforce strict identity verification measures (Schmid, 2021 and Ayoub, 2024).', 'traditional-dns-infrastructures-do-not-inherently-track-media-access-control-mac', 4, false, '2025-09-23 20:33:37.048', '/uploads/images/image-1758044016778-377616253.jpg', 0, 'published', 'Traditional DNS infrastructures do not inherently track Media Access Control (MAC) addresses, making it difficult to validate client devices and enforce strict identity verification measures (Schmid, 2021 and Ayoub, 2024).', 'hierarchical structure and zone and record configuration errors frequently result in security ', 'DNS rules are more vulnerable to cache poisoning and subdomain', 3, 0, 0, 3, '2025-09-16 20:33:37.048', '2025-09-16 20:33:37.054072', '2025-09-16 20:33:37.054072', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);
INSERT INTO public.news VALUES (9, ' Rogue DNS Servers', '2.3.1 Rogue DNS Servers
By giving phony answers to client queries, rogue DNS servers take advantage of the trust-based aspect of DNS resolution and direct users to harmful websites (Trevisan et al. 2017). Large-scale phishing efforts, in which gullible visitors are sent to fake websites that collect login credentials or infect computers with malware, have benefited greatly from these attacks (Akiyama et al. 2013). Additionally, the threat is exacerbated by the presence of DNS tunneling techniques, which allow for command-and-control (C2) communications and data exfiltration (Wang et al., 2021 and Haider et al., 2024). Strict resolver policies, response validation, and DNSSEC deployment are the main focuses of mitigation techniques (AlBalawi et al., 2023). According to research, usage is still restricted because of administrative complexity and performance overheads, which call for more developments in lightweight DNS authentication methods (Bernard, 2021 and Ayoub, 2024).
2.3.2 Misconfigured DNS Servers
Misconfigurations remain a critical issue, often resulting from permissive resolver settings, improper access controls, or neglected security updates (Koushki et al. 2024). Open resolvers, for example, are frequently exploited in reflection-based DDoS attacks, amplifying traffic to overwhelm targets (Poonia and Tinker, 2024). Additionally, insecure zone transfers expose organizational network structures, aiding reconnaissance efforts by threat actors (Gupta et al., 2023). Lyu et al. (2024) 30% of enterprise DNS infrastructures contain misconfigurations that could be leveraged for attack propagation while best practices advocate for disabling recursive resolution, restricting zone transfers, and enforcing regular audits (NIST, 2023), real-world implementation remains inconsistent, particularly among legacy systems. Addressing this requires automated configuration validation tools and enhanced awareness within network administration teams (Smith et al., 2024).
2.3.3 Cache Poisoning
By encouraging attackers to insert malicious records into resolver caches, cache poisoning compromises DNS integrity and makes it easier for malware to spread, phishing attempts, and man-in-the-middle attacks to occur (Man et al. 2020). Recent investigations showed that advanced poisoning tactics continue to evade mitigation measures like query ID entropy and source port randomization (Heartfield and Loukas, 2015). In order to manipulate resolver behavior, attackers are increasingly using side-channel vulnerabilities and fragmented responses (Man et al. 2020). For instance, DNSSEC offers cryptographic validation to prevent cache poisoning, but adoption is still below ideal due to deployment complexity and performance issues (Wang et al. 2025). The approach the research is pursuing is therefore justified by the promise paths that emerging solutions, such as AI-driven anomaly detection and hybrid trust models, offer for enhancing DNS resilience.
', 'Misconfigurations remain a critical issue, often resulting from permissive resolver settings, improper access controls, or neglected security updates (Koushki et al. 2024). Open resolvers, for example, are frequently exploited in reflection-based DDoS attacks, amplifying traffic to overwhelm targets (Poonia and Tinker, 2024). ', '-rogue-dns-servers', 8, false, '2025-09-23 20:49:17.462', '/uploads/images/image-1758044957347-579603708.jpg', 0, 'published', 'DNSSEC offers cryptographic validation to prevent cache poisoning,', 'malware to spread, phishing attempts, and man-in-the-middle attacks to oc', 'Misconfigured DNS Servers Misconfigurations remain a critical issue', 3, 0, 0, 3, '2025-09-16 20:49:17.462', '2025-09-16 20:49:17.46961', '2025-09-16 20:49:17.46961', NULL, NULL, NULL, NULL, 0, 'high', NULL, NULL);
INSERT INTO public.news VALUES (1, 'VybezTribe Movement Launches Progressive Policy Platform', 'The VybezTribe movement today unveiled its comprehensive policy platform focusing on social democracy, economic justice, and transparent governance for Kenya...', 'VybezTribe unveils progressive policy platform for social democratic change in Kenya', 'vybeztribe-launches-progressive-platform', 1, true, NULL, NULL, 24, 'published', 'vybeztribe,politics,policy,social democracy', NULL, 'vybeztribe, politics, kenya, social democracy', 5, 0, 0, 1, '2025-09-11 14:18:48.211378', '2025-09-11 14:18:48.211378', '2025-09-30 11:21:04.390898', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);
INSERT INTO public.news VALUES (5, 'CHAPTER ONE: INTRODUCTION 1.0 Introduction', 'CHAPTER ONE: INTRODUCTION
1.0 Introduction
The chapter provides background information on the challenge and topic, as well as results that aid in identifying the problem, outlining the objectives, formulating the research questions, and providing the rationale and scope of the study. Drawing on global, national, and local frameworks, the general problem of simplified accounting records, internal controls, and technology adoption, as well as the local branch of challenges faced by SACCOs, has not received considerable or contextualized local research. Despite the fact that these financial institutions have adopted ERP and some lending apps, real-time monitoring, predictive analytics, and customer relationship models have yet to be properly analyzed. Given the complete state, the study incorporates moderating and intervening variables—organizational size, regulatory environment, and operational efficiency—that alter the link between the independent and dependent variables.
1.1 Background
Over the last three decades, bookkeeping and accounting have evolved from manual records to computerized systems, including Excel, standalone applications, and ultimately, cloud-based systems and artificial intelligence. Every year, the world has seen enhanced and better functional systems. Kaurav (2025) and Wekesa (2025) reveal that reforms, financial innovations, and digital integration have fueled tremendous transformation. Savings and Credit Cooperative Organizations (SACCOs), particularly in developing economies, have played an important role in promoting financial inclusion and alleviating poverty. Decent record-keeping, combined with stronger and more creative analytics, has strengthened the role of predictive analytics in risk assessment and performance. Small-scale financial management makes a significant contribution to GDP and national savings in developed countries with advanced technology and effective resource management. This highlights the importance of efficient financial management frameworks based on accurate, strong internal controls, accounting records, and technology adoption.
Within Africa, SACCOs have served as significant savings and credit channels for vulnerable communities. According to the World Council of Credit Unions (WOCCU, 2023), over 60,000 SACCOs in Africa serve more than 200 million people, with Kenya ranking second in terms of the most SACCOs and microfinance at large (Sacco Societies Regulatory Authority, 2023). Nonetheless, these institutions, while significant and requiring some level of computer administration, some with ERP and some functioning on the web, have proven vulnerable to fraud. According to Anania and Gikuri (2025), more than 40% of financial losses in East African SACCOs are the result of poor accounting processes, insufficient controls, and a lack of effective technology adaptation.
', 'The chapter provides background information on the challenge and topic, as well as results that aid in identifying the problem, outlining the objectives, formulating the research questions, and providing the rationale and scope of the study.', 'chapter-one-introduction-10-introduction', 1, false, '2025-09-22 21:37:38.213', NULL, 18, 'published', 'POLITICS', 'Decades, bookkeeping and accounting have evolved from manual records to computerized systems, including Excel, standalonE', 'Over the last three decades, bookkeepinG', 2, 0, 0, 3, '2025-09-15 21:37:38.213', '2025-09-15 21:37:38.213479', '2025-09-30 14:35:21.301395', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);
INSERT INTO public.news VALUES (11, ' Data Verification ', '3.7.2 Data Verification
To ensure methodological rigor and minimize extraction errors, ten percent of included studies will undergo independent duplicate data extraction by a second qualified reviewer with expertise in educational leadership research. This dual-extraction process serves as a quality control mechanism to identify potential inconsistencies, misinterpretations, or omissions in data capture. The selection of studies for duplicate extraction will be randomized to avoid bias toward particular study types or characteristics. Inter-reviewer reliability will be calculated using Cohen''s kappa coefficient for categorical variables and intraclass correlation coefficients for continuous variables, with agreement able. Any discrepancies between reviewers will be systematically documented and resolved through structured discussion protocols. Where consensus cannot be achieved through discussion, a third senior reviewer will adjudicate disagreements to ensure final data accuracy and completeness.
3.7.3 Inclusion and Exclusion Criteria 
Rigorous standards revolving around the inclusion and exclusion criteria will be adapted to ensure that only records with reliable and updated information will be considered. Towards ensuring the selection of relevant and high-quality literature. Saha et al. (2010) sampled a large pool of 43,709 records, resulting in the inclusion of 150 randomized controlled trials (RCTs) concentrating on acute respiratory distress syndrome (ARDS). Diverse trials at least (97.3%) determined by the American-European Consensus Conference (AECC) or the Berlin Definition. These consensus definitions concern the duration of hypoxemia, with 80.1% of trials implementing adjustments targeted at improving diagnostic precision. Furthermore, exclusion criteria were rigorously reviewed and classified according to the rationale. 
3.7.4 Comprehensive Literature Search. 
The study will conduct a comprehensive literature search focusing on journals with specific inclusion and exclusion criteria. Booth (2010) analyzed a wide range of techniques targeted at maximizing the retrieval of studies for inclusion in health technology assessment reports, employing approaches such as the Capture-recapture methodology, soliciting feedback from HTA report commissioners, finding disconfirming situations, comparing to a gold standard, measuring known items, and acknowledging the Law of Diminishing Returns. The systematic framework depends on literature efficacy searching tactics and making informed decisions concerning discontinuing the search activity. Wang et al. (2017) provide a focused approach to the complete literature search process to update clinical studies on superparamagnetic iron oxide (SPIO) nanoparticles as magnetic resonance imaging (MRI) contrast agents. The findings were parallel to the search terms tailored through research focus.  
3.7.5 Screening of Data 
The screen search results for studies filter relevant studies from irrelevant studies, the process is inspired by Lauren''s research, which investigated the approach conducted by medical students Lauren et al. (2014) accuracy of title and abstract screening performed by medical students through effect various screening techniques on accuracy and efficiency influenced this study given the range from 46.7% to 66.7%, with those using web-based platforms outperforming their paper-based peers. The results varied between 93.2% and 97.4%, indicating a high level of accuracy in removing irrelevant studies. It will be possible to obtain a comprehensive analysis of the research items by screening and categorising full articles, half articles, and abstracts.  
3.7.6 Grouping of Sources as Per Hypothesis 
Grouping extracted materials into specific hypotheses includes combining various perspectives and approaches from the literature. Khurshid et al. (2021) research Boolean operators, keyword utilization, database selection, and data interpretation, yields critical insights for hypothesis construction. These tools are used during research to determine the best criteria for research articles. While considering the extraction process focused on the need for specific search tactics and the requirement for a comprehensive literature assessment to detect gaps and trends relevant to the study issue, there was also a parallel need to protect the quality of each of these searches. Similarly, Amara''s comprehensive literature evaluation assessed solutions and organised material depending on specific circumstances in 178 papers from 12 relevant research, providing a complementary perspective on literature assessment to identify possible missing literature. Amara''s methodology improved the hypothesis development process by combining data and organizing information within their field. Combining insights enhances coherence and possible comprehensiveness of grouping extracted sources into hypotheses.  
3.7.7 Tabulation and Interpretation of Findings  
Tabulation involves dividing groups of voluminous literature into digestible formats, such as tables or matrices, categorized and arranged through significant themes, variables, and research objectives. Tabulation reveals patterns, trends, and gaps in the literature acutely responding to the research questions. Tabulated findings will then be examined, generating significant insights, discovering overarching trends, and meeting the research objectives. The model draws conclusions, formulate hypotheses, and identify areas for further research. By understanding substantial literature, it is possible to draw current knowledge landscapes, identify research gaps, and add fresh insights. 
', '3.7.2 Data Verification
To ensure methodological rigor and minimize extraction errors, ten percent of included studies will undergo independent duplicate data extraction by a second qualified reviewer with expertise in educational leadership research. This dual-extraction process serves as a quality control mechanism to identify potential inconsistencies, misinterpretations, or omissions in data capture. The selection of studies for duplicate extraction will be randomized to avoid bias toward pa', '-data-verification-', 2, true, '2025-09-24 22:35:22.369', '/uploads/images/image-1758137722323-783332167.jpg', 0, 'published', ' qualified reviewer with expertise in educational leadership research. ', ' qualified reviewer with expertise in educational leadership research. ', ' qualified reviewer with expertise in educational leadership research. ', 4, 0, 0, 3, '2025-09-17 22:35:22.369', '2025-09-17 22:35:22.376332', '2025-09-17 22:35:22.376332', NULL, NULL, NULL, NULL, 0, 'high', NULL, NULL);
INSERT INTO public.news VALUES (12, '2.3 Empirical Evidence of the Research Questions ', '2.3 Empirical Evidence of the Research Questions 
Obj 1: Instructional leaders for differentiated education, 
Current learning institutions are adapting knowledge of targeted interventions addressing specific student needs (Johnson, 2020; Dietrich, 2014) and courses tailored for student success, including special consideration of their chosen life interests and professions. In particular, elementary campuses experience ongoing problems illustrated by the difficulties encountered by fifth-grade reading achievement within the investigated setting (Johnson, 2020; Dietrich, 2014). Targeted professional development programs provide educators with the skills to integrate differentiated teaching and data-driven decision-making (Johnson, 2020 Anh;o, 2023). Dietrich (2014) offers insights on data-driven decision-making and distributed leadership, emphasizing the necessity of leadership models promoting instructional improvement and student accomplishment with themes including decisionmaking and distributed leadership. Furthermore, Anho (2023) contrasts with Dietrich (2014) by providing valuable insights about utilizing principal leadership, revealing the challenges faced in implementing data-driven strategies.  
Qn 1: Approaches do leaders apply to promote varied education within district-level schools 
Effective data-driven decision-making in educational leadership necessitates decisionmaking autonomy at the school level (Wohlstter et al., 2008; Dietrich, 2014), where principals play a critical role in demonstrating data utilization for reflective leadership focused on instructional improvement and student accomplishment. However, problems persist; for example, principals must improve their ability to integrate data-driven decisionmaking towards procedures while needing more regular literacy instruction training (Anho, 2023; Dietrich, 2014; Wohlstter et al., 2008), but such upgrades require technological improvement, which might be beyond the budgetary scope of learning. Furthermore, the disparity in information dissemination between central offices and schools needs a rethinking of accountability mechanisms to ensure fair access to data and decision-making authority (Anho, 2023). 
Durand et al. (2015) and Anderson (2020) discuss how educational institutions might change to meet performance concerns, while Penuel et al. (2017) build on past research by investigating the prevalence of research utilization and leaders'' attitudes toward research in school districts across the United States. Combining these three authors illustrates school and district officials'' bold research use, mainly acquired via professional networks. Promoting evidence-based decision-making procedures among education leaders can increase organizational effectiveness and student outcomes. While Durand et al. (2015) concentrate on the implementation of Common Core State Standards (CCSS) and similar strategies used by district leaders in schools that achieve higher-than-expected results, Anderson (2020) slightly disagree with Durand et al. (2015) where the research investigates how school districts adopt bureaucratic approaches to address identified problems in school and student performance. Both studies emphasize the need to develop organizational capability and implement new techniques to promote coherence and improvement.  
Anderson (2012) investigates the relationship between district policies and actions and their effects on student achievement the research introducing associate higher degree programs and continual problem-solving orientations in the school system engaged through continuous problem-solving approaches, as well as the differences in school performance and interaction between policies for actions. Underscoring the variability of district orientation and capacity to understand school requirements assists in drawing tailored school contexts. Overall, the literature illustrates leadership and the various tactics used. By addressing performance challenges in schooling institutions, it is possible to contribute insights and generate vital evidence-based decision-making to digestive change.  	 	 
 	 	 
Qn 2:  Instructional leaders encourage teachers to execute evidence-based teaching practices 
Brolund (2016) emphasizes the importance of instructional leadership in fostering evidence-based teaching techniques. Klimoski and Amos'' (2013) analysis of leadership in MBA programs revealed reasonable attempts to transform students'' lives. As instructional leaders, principals set clear visions and goals for schools, efficiently manage resources, and provide teachers with professional development opportunities, coaching, and mentoring - like Brown (2016) establishing overlapping practices within the school. The method of improving student learning outcomes illustrates the importance of instructional leadership in promoting evidence-based approaches (Brolund, 2016); similar findings noted by Devine et al. (2013) on teachers'' perceptions and the derived instructional practices linking students'' instructional setting would be helpful to towards evidence-based teaching practices.   
Devine et al. (2013) and Day et al. (2016) investigate the role of instructional coaching and principal actions in determining student results. While Devine et al. (2013) emphasize instructional coaching as a collaborative, evidence-based strategy for improving teaching methods, Day et al. (2016) conducted a comprehensive nationwide study on principal actions in ineffective schools. However, these outcomes are consistent with Klimoski and Amos'' (2012) observations on the irony of leader development in universitybased programs, noting the challenges of replaced mandates within the learning institutions. Parallel findings from Brown (2016) exploring the distinct overlapping and interdependent factors agree with Klimoski and Amos (2012) in accessing the existence of teacher capacity in engaging with research and school cultures being attuned to evidence use and effective learning environment all meant to improve quality of student results. Despite being at the forefront of leadership studies, university professors must implement evidence-based learning procedures to improve the quality of learning. At the same time, such findings would emphasise the importance of incorporating evidence-based approaches into leadership education programs (Klimoski & Amos, 2012). 
In contrast, Brown and Zhang (2016) express concerns regarding the low prevalence of evidence-based practices in schools. They illustrate vital elements influencing the implementation of evidence-based practice in schools, including teacher capacity, school culture, and structural support. Brown and Zhang''s (2016) findings parallel Day et al. (2016) they illustrated the influential 3-year associations. The findings narrowed down to improvement strategies and actions believed to improve student attainment. The improvement strategies focus on models of achieving and sustaining improving leadership strategies. Their findings indicate a disparity between promoting evidence-based practices and their implementation, underlining the importance of focused interventions to close this gap. 
Qn 3: Data-driven decision-making processes toward daily instructional practices 
Schelling and Rubenstein (2021) and Schifter et al. (2014) analyzed data-driven decision-making (DDDM) in education, emphasizing the value of using data to inform instructional changes and better student results. While Schelling and Rubenstein (2021) focus on teachers'' perceptions of D.M. parallel to the Theory of Planned Behavior as a theoretical framework, Schifter et al. (2014) underline the importance of adequately training teachers to use large data sets. Despite accepting the usefulness of DDDM, especially with its special consideration, for example, A.I. or even media, Badaway et al. (2023) express concern regarding privacy, data quality, and potential misuse with the current AI-threatening traditional learning models. They promote a comprehensive and collaborative approach to school data use, assuring ethical and responsible practices would be necessary for further research in managerial competency and instructional leadership development. 
', 'Obj 1: Instructional leaders for differentiated education, 
Current learning institutions are adapting knowledge of targeted interventions addressing specific student needs (Johnson, 2020; Dietrich, 2014) and courses tailored for student success, including special consideration of their chosen life interests and professions. In particular, elementary campuses experience ongoing problems illustrated by the difficulties encountered by fifth-grade reading achievement within the investigated setting', '23-empirical-evidence-of-the-research-questions-', 1, true, '2025-09-25 12:57:19.324', '/uploads/images/image-1758189439063-942090484.jpg', 0, 'published', 'decision-making and distributed leadership, emphasizing the necessity of ', 'Penuel et al. (2017) build on past research by investigating the prevalence of research utilization and leaders'' attitudes toward research in school districts a', 'special consideration of their chosen life interests and professions. In particular, elementary campuses experience ', 6, 0, 0, 3, '2025-09-18 12:57:19.324', '2025-09-18 12:57:19.326861', '2025-09-18 12:57:19.326861', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);
INSERT INTO public.news VALUES (10, 'CHAPTER 1: INTRODUCTION 1.1 Synopsis  While universities work towards improving instructional approaches', 'CHAPTER 1: INTRODUCTION
1.1 Synopsis 
While universities work towards improving instructional approaches, their models or other models focused on improving instructional leadership in the classroom, students'' consistent underperformance and disinterest in learning indicate possible decay in instructional leadership. Focusing on these areas of underperformance will provide a critical understanding of teacher development to unveil how competency is achieved. This chapter aims to introduce the central concept, which is the problem statement – which first highlights possible research gaps and introduces the objectives of each research question. Understanding particular tactics and procedures used by instructional leaders to assist in developing differentiated education, evidence-based instructional techniques, and data-driven decisionmaking and evaluating the difficulties and obstacles that instructional leaders experience while striking a balance between their managerial duties and their expertise in the classroom, it will be possible to know where the challenge stands.  
1.2 Background 
Recent decades of research have focused on understanding and increasing student accomplishment in various educational contexts worldwide (Cadungog, 2015; Lazcano, 2022; Gumus, 2016). Despite government and business sector efforts to improve education quality, the Kenya academic confiuration has faced chronic issues (Gumus, 2016). Despite these efforts, educators, school principals, and Department of Education officials have been confronted by the challenge of improving pupils'' academic performance (Cadungog, 2015). Teachers are critical in this endeavour since they are vital catalysts for school transformation and student success (Kenya. Department of Education, 2007; Alanoglu, 2021). Juma  et al. (2021) purposive sampling of 41 secondary schools in Rangwe Sub County principals and teahers revealed day to day instructions allowed the school to adapt a leadership culture, hence our study is valid. 
While numerous studies have focused on instructional leadership and its impact on teacher efficacy, there is growing interest and need for studies focusing on specific dynamics within county schools (Tahir & Fatima, 2023; Lazcano, 2022). While existing studies frequently focus on individual schools or larger educational systems, developing studies addressing difficulties and opportunities in county-level educational contexts (Tahir & 
Fatima, 2023; Li et al., 2023) would improve instructional and teacher development. Hayes (2020) analyzed the significant themes and statements relating to the challenges of educating principles as part of instructional leadership roles. As such, county schools, which serve as the foundation of many educational systems, have unique organizational structures, resource allocations, and leadership dynamics that necessitate careful examination (Neumerski, 2013). 
Besides, studies within the Anglo-American setting have improved our understanding of instructional leadership. However, empirical research on this topic in varied cultural contexts such as China is limited (Li, 2014), implying that similar setbacks might face the Kenya. Our proposed study focuses on research into the complexities of instructional leadership strategies and their impact on teacher development in culturally and contextually varied settings (Li, 2014; Thien & Liu, 2024). We have given gaps surrounding investigating the effect of instructional leadership on teacher development in county schools (Li et al., 2023). By focusing on this specific environment, the research reveals insights that can inspire targeted interventions and policies to improve teachers Cadungog (2015). Li et al. (2023) suggest that enhancing efficacy improves student outcomes. Drawing on the variable of teacher development, the proposed study aims to contribute to the continuing discussion about instructional leadership and supporting teacher development in county schools by conducting a detailed analysis of existing literature and empirical research (Li et al., 2023). 
1.3 Problem Statement 
The current literature focuses on how instructional leadership shapes teacher development in educational settings (Lazcano, 2022; Gumus, 2016). Despite the abundance of research, the Impact of Instructional Leadership on Teacher Development, especially regarding classroom competency, is yet to be achieved (Tahir & Fatima, 2023; Li et al., 2023). At the same time, earlier research focused on instructional leadership''s impact on teacher efficacy and student results and the the importance of of literature on competency at the classroom level. More research into how instructional leadership techniques emerge and influence teacher development considering a school institution as an organization should also be monitoring the critical role of resource allocations found in county-level educational systems. 
Past research''s inability to investigate the unique strategies and procedures teachers and educators use toward teacher development implies that the research needs more collective findings. At the same time, previous studies failed to show how instructional leaders'' general tactics need more practical approaches used in county schools. Exploring instructional leaders'' specific methods requires researchers to provide actionable insights for improving teacher and student development. Kosencha et al. (2022) examined how cultural practices influence primary-to-secondary school transition rates in Isinya Sub County, 
Kajiado County, where transition rates are lower than in neighboring areas. A mixed-methods approach was used, sampling 173 respondents, including 28 secondary school principals, 39 head teachers, and 106 learners, through stratified random sampling. Data was collected via questionnaires. Findings highlighted a gap in teaching and learning materials, impacting transition rates in Kenya, with Urban areas enjoying better government and infrastracture policies. For Kenyan principals, this underscores the need for strong leadership and targeted training to address cultural barriers, improve resource availability, and enhance student retention, however this has not been matched in the present studies.  
The inability to access challenges faced by instructional leaders toward teacher development has been compounded by managerial obligations (Lan, 2014; Thien & Liu, 2024). Despite proof that such leadership would enhance teachers'' competency, leaders encounter complex hurdles in efficiently implementing pedagogical initiatives and failure to meet administrative responsibilities. Problems include possible resource restrictions, time constraints, competing priorities, and reluctance to change, which would ultimately affect teaching development. Understanding these challenges would enhance targeted interventions and support systems, assisting instructional leaders attract administrators and instructional mentors. 
The study integrates a comprehensive investigation of instructional leadership on teacher development in county-level educational contexts (Cadungog, 2015; Li et al., 2023), arguing more on the social dynamic learning process where a teacher introduces support, tools, and techniques vital in the classroom experience. By integrating a detailed qualitative analysis, the study would reveal complex strategies used by instructional leaders promoting teacher development, including differentiated instruction, evidence-based practices, and datainformed decision-making. As such, investigating the problems instructional leaders face in balancing managerial responsibilities with pedagogical knowledge and providing practical recommendations improves leadership effectiveness and student accomplishment in county schools. 
1.4 Objectives 
Objective 1: Examine the particular tactics and procedures used by instructional leaders to assist in developing differentiated education, evidence-based instructional techniques, and data-driven decision-making. 
', 'This chapter aims to introduce the central concept, which is the problem statement – which first highlights possible research gaps and introduces the objectives of each research question. Understanding particular tactics and procedures used by instructional leaders to assist in developing differentiated education, evidence-based instructional techniques, and data-driven decisionmaking and evaluating the difficulties and obstacles that instructional leaders experience while striking a balance bet', 'chapter-1-introduction-11-synopsis-while-universities-work-towards-improving-instructional-approaches', 1, true, '2025-09-24 22:31:03.13', '/uploads/images/image-1758137462923-194429579.jpg', 82, 'published', 'Understanding particular tactics and procedures used by instructional le', 'Understanding particular tactics and procedures used by instructional le', '', 6, 0, 0, 3, '2025-09-17 22:31:03.13', '2025-09-17 22:31:03.13249', '2025-09-30 19:06:08.171712', NULL, NULL, NULL, NULL, 0, 'high', NULL, NULL);
INSERT INTO public.news VALUES (7, 'originally designed with security in mind, leading to inherent technological vulnerabilities', 'DNS, as a foundational internet protocol, was not originally designed with security in mind, leading to inherent technological vulnerabilities. Studies highlight weaknesses such as insufficient request validation, lack of origin authentication, and susceptibility to data manipulation (Kim et al. 2020, p. 53). Attackers exploit these flaws to conduct DNS tunnelling, exfiltrating sensitive data through covert channels hidden within DNS queries. Furthermore, domain generation algorithms (DGAs) enable malware to dynamically generate new domain names, bypassing traditional security controls and making threat containment challenging (Li et al. 2019). The increasing adoption of encrypted DNS protocols introduces both security benefits and new attack surfaces, as adversaries leverage DoH to evade detection by security appliances that rely on deep packet inspection (Sharma et al. 2023). Addressing these vulnerabilities requires a multi-layered security approach, integrating real-time monitoring, anomaly detection, and adaptive threat intelligence mechanisms.
2.2.7 Limitations in Current DNS Security
Despite advancements in DNS security, existing measures continue to exhibit critical limitations a major challenge include the significant issue is the difficulty in achieving comprehensive validation of DNS responses, leaving systems vulnerable to spoofing and redirection attacks (Lyu et al. 2022, Schmid et al. 2021, and Lu et al. 2019). Research suggests that the implementation of DNSSEC, while beneficial, is inconsistent across different infrastructures, resulting in gaps that attackers can exploit (Yang et al. 2023). Additionally, the scalability of DNS security solutions remains a challenge, as high-performance networks experience latency and increased processing overhead when deploying cryptographic protections. The integration of artificial intelligence (AI) and machine learning in DNS security shows promise, yet concerns regarding accuracy, false positives, and adversarial machine learning attacks must be addressed to enhance effectiveness (Alotaibi et al. 2023). Moving forward, adaptive DNS security frameworks that leverage real-time analytics and behavioural threat modelling are being explored to mitigate these persistent security gaps 
', 'of encrypted DNS protocols introduces both security benefits and new attack surfaces, as adversaries leverage DoH to evade detection by security appliances that rely on deep packet inspection (Sharma et al. 2023). Addressing these vulnerabilities requires a multi-layered security approach, integrating real-time monitoring, anomaly detection, and adaptive threat intelligence mechanisms.', 'originally-designed-with-security-in-mind-leading-to-inherent-technological-vulnerabilities', 3, false, '2025-09-23 20:31:44.208', '/uploads/images/image-1758043904019-724969461.jpg', 10, 'published', 'artificial intelligence (AI) and machine learning in DNS security shows ', 'DNS responses, leaving systems vulnerable to spoofing and redirection attacks', 'artificial intelligence (AI) and machine learning in DNS security shows ', 2, 0, 0, 3, '2025-09-16 20:31:44.208', '2025-09-16 20:31:44.213909', '2025-09-30 14:34:11.774045', NULL, NULL, NULL, NULL, 0, 'high', NULL, NULL);
INSERT INTO public.news VALUES (4, 'CHAPTER ONE: INTRODUCTION', 'Despite the fact that these financial institutions have adopted ERP and some lending apps, real-time monitoring, predictive analytics, and customer relationship models have yet to be properly analyzed. Given the complete state, the study incorporates moderating and intervening variables—organizational size, regulatory environment, and operational efficiency—that alter the link between the independent and dependent variables.
1.1 Background
Over the last three decades, bookkeeping and accounting have evolved from manual records to computerized systems, including Excel, standalone applications, and ultimately, cloud-based systems and artificial intelligence. Every year, the world has seen enhanced and better functional systems. Kaurav (2025) and Wekesa (2025) reveal that reforms, financial innovations, and digital integration have fueled tremendous transformation. Savings and Credit Cooperative Organizations (SACCOs), particularly in developing economies, have played an important role in promoting financial inclusion and alleviating poverty. Decent record-keeping, combined with stronger and more creative analytics, has strengthened the role of predictive analytics in risk assessment and performance. Small-scale financial management makes a significant contribution to GDP and national savings in developed countries with advanced technology and effective resource management. This highlights the importance of efficient financial management frameworks based on accurate, strong internal controls, accounting records, and technology adoption.
Within Africa, SACCOs have served as significant savings and credit channels for vulnerable communities. According to the World Council of Credit Unions (WOCCU, 2023), over 60,000 SACCOs in Africa serve more than 200 million people, with Kenya ranking second in terms of the most SACCOs and microfinance at large (Sacco Societies Regulatory Authority, 2023). Nonetheless, these institutions, while significant and requiring some level of computer administration, some with ERP and some functioning on the web, have proven vulnerable to fraud. According to Anania and Gikuri (2025), more than 40% of financial losses in East African SACCOs are the result of poor accounting processes, insufficient controls, and a lack of effective technology adaptation.
', 'CHAPTER ONE: INTRODUCTION
1.0 Introduction
The chapter provides background information on the challenge and topic, as well as results that aid in identifying the problem, outlining the objectives, formulating the research questions, and providing the rationale and scope of the study. Drawing on global, national, and local frameworks, the general problem of simplified accounting records, internal controls, and technology adoption, as well as the local branch of challenges faced by SACCOs, has not', 'chapter-one-introduction', 1, false, '2025-09-22 21:27:49.773', NULL, 32, 'published', 'Technology', 'inancial institutions have adopted ERP and some lending apps,', 'Technology', 2, 0, 0, 3, '2025-09-15 21:27:49.773', '2025-09-15 21:27:49.78724', '2025-09-30 14:35:18.300319', NULL, NULL, NULL, NULL, 0, 'high', NULL, NULL);
INSERT INTO public.news VALUES (6, 'Domain Name System (DNS), focusing on its design, operational mechanisms,', 'CHAPTER TWO: LITERATURE REVIEW
2.1 Introduction
This chapter presents a comprehensive review of the Domain Name System (DNS), focusing on its design, operational mechanisms, inherent vulnerabilities and solution deployment. The chapter analyses current international literature regarding anomalies facing the DNS, as such in detail explore various DNS attack vectors and critically assesses both existing and proposed solutions aimed at mitigating these threats. The goal is to identify whether there are underlying research gaps, regarding machine learning DNS architecture and whether such as ML based solutions would be effective and customizable in Kenyan banking infrastructure. Also, the chapter justifies the roles of machine architecture towards mitigating vulnerabilities facing DNS, and how effective it would be compared to other legacy systems of DNS architecture. The chapter concludes by identifying gaps in current research and practice, proposing a conceptual framework to enhance DNS security, particularly within the context of the Kenyan banking sector.
2.2 Technology Review
Understanding DNS architecture would assist in noting the possible vulnerabilities facing DNS and possibly evaluate machine learning solutions that would be integrated to mitigate anomalies.  Analyzing the structural components of DNS, including recursive resolvers, authoritative name servers, and caching mechanisms researchers would pinpoint on the gaps. Machine learning-driven anomaly detection provides an innovative solution by identifying malicious patterns in real-time, enabling proactive threat mitigation. Integrating AI-enhanced security models into DNS infrastructure can significantly improve resilience against evolving cyber threats.
2.2.1 Design of DNS
 Domain Name System (DNS) provides a decentralized, hierarchical method converting human-readable domain names into machine-readable IP addresses. Users can easily access online services and browse the web without having to commit complicated numerical addresses to memory for instance root name servers, top-level domain (TLD) name servers, authoritative name servers, and recursive resolvers often distributed architecture that powers DNS. The hierarchical series of queries to these servers provides inputs a domain name into a web browser, until it obtains the proper IP address. Ideally, caching systems improve efficiency by decreasing response times and network congestion. For name resolution and network functionality, DNS servers store a wide array of records, including A records for IPv4 addresses, AAAA records for IPv6, MX records for mail exchange, and CNAME records for aliases, as well logs on how each transaction took place.
', '2.2 Technology Review
Understanding DNS architecture would assist in noting the possible vulnerabilities facing DNS and possibly evaluate machine learning solutions that would be integrated to mitigate anomalies.  Analyzing the structural components of DNS, including recursive resolvers, authoritative name servers, and caching mechanisms researchers would pinpoint on the gaps. Machine learning-driven anomaly detection provides an innovative solution by identifying malicious patterns in real-time', 'domain-name-system-dns-focusing-on-its-design-operational-mechanisms', 2, false, '2025-09-23 20:28:28.002', '/uploads/images/image-1758043707716-376210366.jpg', 15, 'published', 'root name servers, top-level domain (TLD) name servers, authoritative', '', 'Understanding DNS architecture would assist in ', 2, 0, 0, 3, '2025-09-16 20:28:28.002', '2025-09-16 20:28:28.013069', '2025-09-30 13:30:04.22234', NULL, NULL, NULL, NULL, 0, 'medium', NULL, NULL);


--
-- Data for Name: news_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: news_reactions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: news_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: subscribers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: volunteers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: activity_log_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_log_activity_id_seq', 1, false);


--
-- Name: admin_activity_log_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_activity_log_log_id_seq', 10, true);


--
-- Name: admin_notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_notifications_notification_id_seq', 1, false);


--
-- Name: admins_admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admins_admin_id_seq', 5, true);


--
-- Name: breaking_news_breaking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.breaking_news_breaking_id_seq', 1, false);


--
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 17, true);


--
-- Name: donations_donation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.donations_donation_id_seq', 1, false);


--
-- Name: event_registrations_registration_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.event_registrations_registration_id_seq', 1, false);


--
-- Name: events_event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_event_id_seq', 1, false);


--
-- Name: media_media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.media_media_id_seq', 1, false);


--
-- Name: news_comments_comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_comments_comment_id_seq', 1, false);


--
-- Name: news_news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_news_id_seq', 13, true);


--
-- Name: news_reactions_reaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_reactions_reaction_id_seq', 1, false);


--
-- Name: news_shares_share_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_shares_share_id_seq', 1, false);


--
-- Name: referrals_referral_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.referrals_referral_id_seq', 1, false);


--
-- Name: subscribers_subscriber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscribers_subscriber_id_seq', 1, false);


--
-- Name: tags_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_tag_id_seq', 1, false);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);


--
-- Name: volunteers_volunteer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.volunteers_volunteer_id_seq', 1, false);


--
-- Name: activity_log activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_pkey PRIMARY KEY (activity_id);


--
-- Name: admin_activity_log admin_activity_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_pkey PRIMARY KEY (log_id);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_phone_key UNIQUE (phone);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (admin_id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: breaking_news breaking_news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.breaking_news
    ADD CONSTRAINT breaking_news_pkey PRIMARY KEY (breaking_id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: donations donations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_pkey PRIMARY KEY (donation_id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (registration_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (event_id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (media_id);


--
-- Name: news_comments news_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_pkey PRIMARY KEY (comment_id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (news_id);


--
-- Name: news_reactions news_reactions_news_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_news_id_user_id_key UNIQUE (news_id, user_id);


--
-- Name: news_reactions news_reactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_pkey PRIMARY KEY (reaction_id);


--
-- Name: news_shares news_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_shares
    ADD CONSTRAINT news_shares_pkey PRIMARY KEY (share_id);


--
-- Name: news news_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_slug_key UNIQUE (slug);


--
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (referral_id);


--
-- Name: admin_session_store session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_session_store
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: subscribers subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_email_key UNIQUE (email);


--
-- Name: subscribers subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscribers
    ADD CONSTRAINT subscribers_pkey PRIMARY KEY (subscriber_id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (tag_id);


--
-- Name: tags tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_slug_key UNIQUE (slug);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: volunteers volunteers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_email_key UNIQUE (email);


--
-- Name: volunteers volunteers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_phone_key UNIQUE (phone);


--
-- Name: volunteers volunteers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.volunteers
    ADD CONSTRAINT volunteers_pkey PRIMARY KEY (volunteer_id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.admin_session_store USING btree (expire);


--
-- Name: idx_activity_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activity_created ON public.activity_log USING btree (created_at);


--
-- Name: idx_admin_activity_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_activity_created ON public.admin_activity_log USING btree (created_at);


--
-- Name: idx_admin_sessions_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_sessions_active ON public.admin_sessions USING btree (is_active, expires_at);


--
-- Name: idx_admin_sessions_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_sessions_admin ON public.admin_sessions USING btree (admin_id);


--
-- Name: idx_admins_login; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_login ON public.admins USING btree (email, phone, username);


--
-- Name: idx_admins_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admins_username ON public.admins USING btree (username);


--
-- Name: idx_breaking_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_breaking_active ON public.breaking_news USING btree (active);


--
-- Name: idx_breaking_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_breaking_priority ON public.breaking_news USING btree (priority);


--
-- Name: idx_comments_moderation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_moderation ON public.news_comments USING btree (status, created_at);


--
-- Name: idx_comments_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_status ON public.news_comments USING btree (status);


--
-- Name: idx_news_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_category ON public.news USING btree (category_id);


--
-- Name: idx_news_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_featured ON public.news USING btree (featured);


--
-- Name: idx_news_performance; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_performance ON public.news USING btree (views, likes_count, comments_count);


--
-- Name: idx_news_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_priority ON public.news USING btree (priority);


--
-- Name: idx_news_published; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_published ON public.news USING btree (published_at);


--
-- Name: idx_news_quotes_data; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_quotes_data ON public.news USING gin (quotes_data);


--
-- Name: idx_news_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_news_status ON public.news USING btree (status);


--
-- Name: idx_subscribers_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subscribers_status ON public.subscribers USING btree (status);


--
-- Name: idx_user_registration; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_registration ON public.users USING btree (created_at, status);


--
-- Name: admins update_admins_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: breaking_news update_breaking_news_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_breaking_news_updated_at BEFORE UPDATE ON public.breaking_news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: donations update_donations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_registrations update_event_registrations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON public.event_registrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: events update_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: media update_media_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_media_updated_at BEFORE UPDATE ON public.media FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: news_comments update_news_comments_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_news_comments_updated_at BEFORE UPDATE ON public.news_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: news update_news_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: referrals update_referrals_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscribers update_subscribers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON public.subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: tags update_tags_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: volunteers update_volunteers_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_volunteers_updated_at BEFORE UPDATE ON public.volunteers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_log activity_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(admin_id) ON DELETE SET NULL;


--
-- Name: activity_log activity_log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_log
    ADD CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: admin_activity_log admin_activity_log_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_activity_log
    ADD CONSTRAINT admin_activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(admin_id) ON DELETE CASCADE;


--
-- Name: admin_notifications admin_notifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(admin_id) ON DELETE CASCADE;


--
-- Name: admin_sessions admin_sessions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(admin_id) ON DELETE CASCADE;


--
-- Name: breaking_news breaking_news_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.breaking_news
    ADD CONSTRAINT breaking_news_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(admin_id) ON DELETE SET NULL;


--
-- Name: breaking_news breaking_news_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.breaking_news
    ADD CONSTRAINT breaking_news_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(news_id) ON DELETE CASCADE;


--
-- Name: donations donations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.donations
    ADD CONSTRAINT donations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(event_id) ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admins(admin_id) ON DELETE SET NULL;


--
-- Name: media media_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(admin_id) ON DELETE SET NULL;


--
-- Name: media media_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.admins(admin_id) ON DELETE SET NULL;


--
-- Name: news news_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id) ON DELETE SET NULL;


--
-- Name: news_comments news_comments_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(news_id) ON DELETE CASCADE;


--
-- Name: news_comments news_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.news_comments(comment_id) ON DELETE CASCADE;


--
-- Name: news_comments news_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_comments
    ADD CONSTRAINT news_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: news_reactions news_reactions_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(news_id) ON DELETE CASCADE;


--
-- Name: news_reactions news_reactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_reactions
    ADD CONSTRAINT news_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: news_shares news_shares_news_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_shares
    ADD CONSTRAINT news_shares_news_id_fkey FOREIGN KEY (news_id) REFERENCES public.news(news_id) ON DELETE CASCADE;


--
-- Name: news_shares news_shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news_shares
    ADD CONSTRAINT news_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- Name: referrals referrals_referred_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referred_id_fkey FOREIGN KEY (referred_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: referrals referrals_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: users users_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(user_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

-- Grant privileges to cPanel user
GRANT ALL ON ALL TABLES IN SCHEMA public TO hoyvbvpx_karisvybez;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO hoyvbvpx_karisvybez;
GRANT USAGE ON SCHEMA public TO hoyvbvpx_karisvybez;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hoyvbvpx_karisvybez;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hoyvbvpx_karisvybez;