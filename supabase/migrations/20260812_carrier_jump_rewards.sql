-- Carrier Jump 포인트 미션과 리워드 카탈로그
-- 브라우저에는 공개 RPC만 노출하고 실제 적립 로직은 private 스키마에서 처리합니다.

insert into public.missions (slug, title, description, target_minutes, min_temperature, reward_points, is_active)
values
  ('daily-attendance', '오늘 출석하기', '오늘의 GreenON 여정을 시작하고 출석을 남겨요.', 0, 0, 100, true),
  ('energy-guide', '에어컨 절약 방법 확인하기', '26℃ 이상 설정과 필터 관리 방법을 확인해요.', 0, 0, 200, true),
  ('eco-quiz', '친환경 냉방 퀴즈 참여하기', '간단한 냉방 퀴즈로 절약 상식을 점검해요.', 0, 0, 300, true),
  ('weekly-attendance', '일주일 연속 출석하기', '7일 연속 출석을 달성하면 보너스를 받아요.', 0, 0, 500, true)
on conflict (slug) do update
set title = excluded.title,
    description = excluded.description,
    target_minutes = excluded.target_minutes,
    min_temperature = excluded.min_temperature,
    reward_points = excluded.reward_points,
    is_active = true;

update public.rewards set is_active = false;

insert into public.rewards (slug, category, name, description, price, icon, is_active, sort_order)
values
  ('coffee-coupon', 'food', '아이스 아메리카노 교환권', '시원한 아이스 아메리카노 모바일 교환권이에요.', 1500, '☕', true, 1),
  ('convenience-gift', 'life', '편의점 상품권', '가까운 편의점에서 사용할 수 있는 모바일 상품권이에요.', 3000, '🏪', true, 2),
  ('eco-tumbler', 'life', '친환경 텀블러', '일회용 컵 사용을 줄여 주는 GreenON 텀블러예요.', 5000, '🥤', true, 3),
  ('carrier-goods', 'carrier', 'Carrier 굿즈 세트', 'Carrier Jump 크루를 위한 특별한 굿즈 세트예요.', 8000, '🎁', true, 4)
on conflict (slug) do update
set category = excluded.category,
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    icon = excluded.icon,
    is_active = true,
    sort_order = excluded.sort_order;

create schema if not exists private;

create or replace function private.complete_quick_mission_impl(p_mission_id bigint)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_today date := (now() at time zone 'Asia/Seoul')::date;
  v_mission public.missions%rowtype;
  v_record_id bigint;
  v_attendance_days integer;
begin
  if v_user_id is null then
    raise exception 'authentication required';
  end if;

  -- 같은 사용자의 동시 요청을 직렬화하여 포인트 중복 적립을 막습니다.
  perform 1 from public.profiles where id = v_user_id for update;

  select * into v_mission
  from public.missions
  where id = p_mission_id
    and slug in ('daily-attendance', 'energy-guide', 'eco-quiz', 'weekly-attendance')
    and is_active = true;

  if not found then
    raise exception 'quick mission not found';
  end if;

  if exists (
    select 1 from public.user_missions
    where user_id = v_user_id
      and mission_id = v_mission.id
      and mission_date = v_today
      and reward_granted = true
  ) then
    raise exception 'mission already completed';
  end if;

  if v_mission.slug = 'weekly-attendance' then
    select count(distinct um.mission_date)::integer into v_attendance_days
    from public.user_missions um
    join public.missions m on m.id = um.mission_id
    where um.user_id = v_user_id
      and m.slug = 'daily-attendance'
      and um.status = 'success'
      and um.reward_granted = true
      and um.mission_date between v_today - 6 and v_today;

    if v_attendance_days < 7 then
      raise exception 'seven consecutive attendance required';
    end if;
  end if;

  insert into public.user_missions (
    user_id, mission_id, mission_date, status, elapsed_minutes, reward_granted, completed_at
  ) values (
    v_user_id, v_mission.id, v_today, 'success', v_mission.target_minutes, true, now()
  )
  on conflict (user_id, mission_id, mission_date) do update
  set status = 'success',
      elapsed_minutes = excluded.elapsed_minutes,
      reward_granted = true,
      completed_at = now()
  where public.user_missions.reward_granted = false
  returning id into v_record_id;

  if v_record_id is null then
    raise exception 'mission already completed';
  end if;

  insert into public.point_transactions (
    user_id, transaction_type, amount, description, user_mission_id
  ) values (
    v_user_id, 'earn', v_mission.reward_points, v_mission.title || ' 완료', v_record_id
  );

  return v_mission.reward_points;
end;
$$;

create or replace function public.complete_quick_mission(p_mission_id bigint)
returns integer
language sql
set search_path = ''
as $$
  select private.complete_quick_mission_impl(p_mission_id);
$$;

revoke all on function private.complete_quick_mission_impl(bigint) from public, anon, authenticated;
revoke all on function public.complete_quick_mission(bigint) from public, anon;
grant execute on function public.complete_quick_mission(bigint) to authenticated;

-- Data API 접근 권한은 인증 사용자에게 필요한 작업만 명시적으로 허용합니다.
grant select on public.missions, public.rewards to authenticated;
grant select, insert, update on public.user_missions to authenticated;
grant select on public.point_transactions, public.orders to authenticated;

