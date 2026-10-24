from datetime import date, datetime
from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from app.repositories.base import (
    ActivityEvent,
    ActivityEventsRepoBase,
    AIAnalysisReport,
    AIAnalysisRepoBase,
    AnalyticsRepoBase,
    Badge,
    CatalogRepoBase,
    CategoryMaterial,
    CenterDocMeta,
    CenterDocsRepoBase,
    CenterSearchResult,
    CenterStatusHistory,
    CenterVerification,
    CentersRepoBase,
    DeviceCategory,
    DevicePhotoMeta,
    DevicePhotoRepoBase,
    LeaderboardEntry,
    PointsLedgerEntry,
    PointsRepoBase,
    Receipt,
    RecyclingCenter,
    RecyclingRecord,
    RecordStatusHistory,
    RecordsRepoBase,
    Redemption,
    Reward,
    RewardsRepoBase,
    Session,
    SessionsRepoBase,
    User,
    UserBadge,
    UsersRepoBase,
    VerificationRepoBase,
)
from app.repositories.mock.mock_store import get_mock_store, haversine_distance_meters


class MockUsersRepo(UsersRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        return self.store.users.get(user_id)

    async def get_by_email(self, email: str) -> Optional[User]:
        for u in self.store.users.values():
            if u.email.lower() == email.lower():
                return u
        return None

    async def create_user(self, email: str, password_hash: str, full_name: str, role_id: int, phone: Optional[str] = None) -> User:
        if await self.get_by_email(email):
            raise ValueError(f"User with email '{email}' already exists.")
        
        user_id = uuid4()
        role_name = self.store.roles.get(role_id, "user")
        user = User(
            id=user_id,
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            role_id=role_id,
            role_name=role_name,
            phone=phone,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.store.users[user_id] = user
        return user

    async def update_user(self, user_id: UUID, full_name: Optional[str] = None, phone: Optional[str] = None) -> Optional[User]:
        user = self.store.users.get(user_id)
        if not user:
            return None
        if full_name is not None:
            user.full_name = full_name
        if phone is not None:
            user.phone = phone
        user.updated_at = datetime.utcnow()
        return user


class MockSessionsRepo(SessionsRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def create_session(self, session_id: str, user_id: UUID, session_data: Dict[str, Any], expires_at: datetime) -> Session:
        session = Session(
            session_id=session_id,
            user_id=user_id,
            session_data=session_data,
            expires_at=expires_at,
            created_at=datetime.utcnow(),
        )
        self.store.sessions[session_id] = session
        return session

    async def get_session(self, session_id: str) -> Optional[Session]:
        session = self.store.sessions.get(session_id)
        if not session:
            return None
        if session.expires_at <= datetime.utcnow():
            del self.store.sessions[session_id]
            return None
        return session

    async def delete_session(self, session_id: str) -> bool:
        if session_id in self.store.sessions:
            del self.store.sessions[session_id]
            return True
        return False

    async def delete_user_sessions(self, user_id: UUID) -> int:
        to_del = [sid for sid, s in self.store.sessions.items() if s.user_id == user_id]
        for sid in to_del:
            del self.store.sessions[sid]
        return len(to_del)

    async def cleanup_expired(self) -> int:
        now = datetime.utcnow()
        to_del = [sid for sid, s in self.store.sessions.items() if s.expires_at <= now]
        for sid in to_del:
            del self.store.sessions[sid]
        return len(to_del)


class MockCatalogRepo(CatalogRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def list_categories(self, active_only: bool = True) -> List[DeviceCategory]:
        cats = list(self.store.categories.values())
        if active_only:
            cats = [c for c in cats if c.is_active]
        return sorted(cats, key=lambda c: c.name)

    async def get_category_by_id(self, category_id: UUID) -> Optional[DeviceCategory]:
        return self.store.categories.get(category_id)

    async def get_category_by_code(self, code: str) -> Optional[DeviceCategory]:
        for c in self.store.categories.values():
            if c.code.upper() == code.upper():
                return c
        return None

    async def create_category(self, code: str, name: str, description: Optional[str], handling_priority: str, base_points: int, points_per_kg: float) -> DeviceCategory:
        cat_id = uuid4()
        cat = DeviceCategory(
            category_id=cat_id,
            code=code.upper(),
            name=name,
            description=description,
            handling_priority=handling_priority,
            base_points=base_points,
            points_per_kg=points_per_kg,
            is_active=True,
            created_at=datetime.utcnow(),
        )
        self.store.categories[cat_id] = cat
        return cat

    async def get_category_materials(self, category_id: UUID) -> List[CategoryMaterial]:
        return self.store.category_materials.get(category_id, [])


class MockCentersRepo(CentersRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def search_nearby(self, lat: float, lng: float, radius_km: float = 25.0, category_id: Optional[UUID] = None, verified_only: bool = True) -> List[CenterSearchResult]:
        target_code = None
        if category_id:
            cat = self.store.categories.get(category_id)
            if cat:
                target_code = cat.code

        results: List[CenterSearchResult] = []
        for center in self.store.centers.values():
            if verified_only and center.current_verification_status != "verified":
                continue
            if target_code and target_code not in center.accepted_categories:
                continue

            dist_m = haversine_distance_meters(lat, lng, center.latitude, center.longitude)
            dist_km = dist_m / 1000.0

            if dist_km <= radius_km:
                results.append(CenterSearchResult(
                    center_id=center.center_id,
                    name=center.name,
                    address=center.address,
                    contact_phone=center.contact_phone,
                    contact_email=center.contact_email,
                    latitude=center.latitude,
                    longitude=center.longitude,
                    operational_hours=center.operational_hours,
                    distance_meters=round(dist_m, 1),
                    distance_km=round(dist_km, 2),
                    verification_status=center.current_verification_status,
                    accepted_categories=center.accepted_categories,
                ))

        results.sort(key=lambda r: r.distance_meters)
        return results

    async def get_by_id(self, center_id: UUID) -> Optional[RecyclingCenter]:
        return self.store.centers.get(center_id)

    async def create_center(self, name: str, address: str, contact_phone: Optional[str], contact_email: Optional[str], latitude: float, longitude: float, operational_hours: Dict[str, Any], current_verification_status: str, created_by: Optional[UUID], accepted_categories: List[UUID]) -> RecyclingCenter:
        center_id = uuid4()
        cat_codes = [self.store.categories[cid].code for cid in accepted_categories if cid in self.store.categories]
        center = RecyclingCenter(
            center_id=center_id,
            name=name,
            address=address,
            contact_phone=contact_phone,
            contact_email=contact_email,
            latitude=latitude,
            longitude=longitude,
            operational_hours=operational_hours,
            current_verification_status=current_verification_status,
            created_by=created_by,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            accepted_categories=cat_codes,
        )
        self.store.centers[center_id] = center
        return center

    async def update_center(self, center_id: UUID, name: Optional[str] = None, address: Optional[str] = None, contact_phone: Optional[str] = None, contact_email: Optional[str] = None, operational_hours: Optional[Dict[str, Any]] = None, current_verification_status: Optional[str] = None) -> Optional[RecyclingCenter]:
        center = self.store.centers.get(center_id)
        if not center:
            return None
        old_status = center.current_verification_status
        if name is not None:
            center.name = name
        if address is not None:
            center.address = address
        if contact_phone is not None:
            center.contact_phone = contact_phone
        if contact_email is not None:
            center.contact_email = contact_email
        if operational_hours is not None:
            center.operational_hours = operational_hours
        if current_verification_status is not None:
            center.current_verification_status = current_verification_status
            if old_status != current_verification_status:
                self.store.center_history.append(CenterStatusHistory(
                    history_id=uuid4(),
                    center_id=center_id,
                    old_status=old_status,
                    new_status=current_verification_status,
                    changed_by=None,
                    reason="Status updated via center lifecycle transition",
                    changed_at=datetime.utcnow(),
                ))
        center.updated_at = datetime.utcnow()
        return center

    async def list_all_centers(self) -> List[RecyclingCenter]:
        return list(self.store.centers.values())


class MockVerificationRepo(VerificationRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def create_verification(self, center_id: UUID, status: str, reviewer_id: Optional[UUID], valid_from: Optional[date], valid_until: Optional[date], rejection_reason: Optional[str]) -> CenterVerification:
        center = self.store.centers.get(center_id)
        if not center:
            raise ValueError("Center not found.")
        old_status = center.current_verification_status
        center.current_verification_status = status
        center.updated_at = datetime.utcnow()

        v_id = uuid4()
        verif = CenterVerification(
            verification_id=v_id,
            center_id=center_id,
            status=status,
            reviewer_id=reviewer_id,
            valid_from=valid_from,
            valid_until=valid_until,
            rejection_reason=rejection_reason,
            reviewed_at=datetime.utcnow(),
            created_at=datetime.utcnow(),
        )
        if center_id not in self.store.verifications:
            self.store.verifications[center_id] = []
        self.store.verifications[center_id].append(verif)

        if old_status != status:
            self.store.center_history.append(CenterStatusHistory(
                history_id=uuid4(),
                center_id=center_id,
                old_status=old_status,
                new_status=status,
                changed_by=reviewer_id,
                reason=rejection_reason or f"Verification decision: {status}",
                changed_at=datetime.utcnow(),
            ))
        return verif

    async def get_verifications_for_center(self, center_id: UUID) -> List[CenterVerification]:
        return sorted(self.store.verifications.get(center_id, []), key=lambda v: v.created_at, reverse=True)

    async def get_status_history(self, center_id: UUID) -> List[CenterStatusHistory]:
        return [h for h in self.store.center_history if h.center_id == center_id]


class MockRecordsRepo(RecordsRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def create_record(self, user_id: UUID, center_id: UUID, category_id: UUID, weight_kg: float, estimated_units: int, notes: Optional[str], mongo_photo_id: Optional[UUID] = None, receipt_reference: Optional[str] = None) -> RecyclingRecord:
        if receipt_reference and receipt_reference.strip() in self.store.receipt_references:
            raise ValueError(f"Duplicate receipt error: Receipt '{receipt_reference}' has already been registered.")

        record_id = uuid4()
        cat = self.store.categories.get(category_id)
        center = self.store.centers.get(center_id)

        clean_ref = receipt_reference.strip() if receipt_reference else None
        rec = RecyclingRecord(
            record_id=record_id,
            user_id=user_id,
            center_id=center_id,
            category_id=category_id,
            weight_kg=weight_kg,
            estimated_units=estimated_units,
            status="pending",
            notes=notes,
            mongo_photo_id=mongo_photo_id,
            receipt_reference=clean_ref,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            category_name=cat.name if cat else None,
            category_code=cat.code if cat else None,
            center_name=center.name if center else None,
        )
        self.store.records[record_id] = rec

        if clean_ref:
            v_verif_code = f"VCODE-{str(uuid4())[:12]}"
            receipt = Receipt(
                receipt_id=uuid4(),
                record_id=record_id,
                receipt_reference=clean_ref,
                issued_by_center_id=center_id,
                issuance_date=date.today(),
                verification_code=v_verif_code,
                created_at=datetime.utcnow(),
                center_name=center.name if center else None,
                center_address=center.address if center else None,
                weight_kg=weight_kg,
                user_id=user_id,
            )
            self.store.receipts[record_id] = receipt
            self.store.receipt_references[clean_ref] = receipt

        return rec

    async def get_by_id(self, record_id: UUID) -> Optional[RecyclingRecord]:
        return self.store.records.get(record_id)

    async def list_by_user(self, user_id: UUID) -> List[RecyclingRecord]:
        user_recs = [r for r in self.store.records.values() if r.user_id == user_id]
        for r in user_recs:
            if r.record_id in self.store.receipts:
                r.receipt_reference = self.store.receipts[r.record_id].receipt_reference
        return sorted(user_recs, key=lambda r: r.created_at, reverse=True)

    async def list_pending_queue(self) -> List[RecyclingRecord]:
        pending = [r for r in self.store.records.values() if r.status == "pending"]
        return sorted(pending, key=lambda r: r.created_at)

    async def approve_and_award(self, record_id: UUID, reviewer_id: UUID, receipt_reference: Optional[str] = None, verification_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Emulates 007_functions.sql approve_and_award_recycling_record exactly:
        - Atomic record status update
        - Generates/validates unique receipt reference
        - Exactly ONE points award in points_ledger (idempotent if repeated)
        """
        rec = self.store.records.get(record_id)
        if not rec:
            raise ValueError(f"Record {record_id} does not exist.")

        # Check if already awarded
        if record_id in self.store.ledger_by_record:
            return {
                "success": True,
                "status": rec.status,
                "record_id": record_id,
                "points_awarded": 0,
                "already_awarded": True,
                "message": "Record was already approved and points previously awarded."
            }

        if rec.status == "rejected":
            raise ValueError("Cannot approve a rejected record without prior status reset.")

        # Calculate points
        cat = self.store.categories.get(rec.category_id)
        if cat:
            points_calc = round(cat.base_points + (rec.weight_kg * cat.points_per_kg))
        else:
            points_calc = 50

        # Update record
        old_status = rec.status
        rec.status = "approved"
        rec.updated_at = datetime.utcnow()

        if old_status != "approved":
            self.store.record_history.append(RecordStatusHistory(
                history_id=uuid4(),
                record_id=record_id,
                old_status=old_status,
                new_status="approved",
                changed_by=reviewer_id,
                reason="Status updated to approved",
                changed_at=datetime.utcnow(),
            ))

        # Receipt reference check & creation
        v_receipt_ref = receipt_reference or f"REC-{date.today().strftime('%Y%m%d')}-{str(record_id)[:8]}"
        v_verif_code = verification_code or f"VCODE-{str(uuid4())[:12]}"

        # Unique receipt reference check
        if v_receipt_ref in self.store.receipt_references and self.store.receipt_references[v_receipt_ref].record_id != record_id:
            raise ValueError(f"Duplicate receipt reference '{v_receipt_ref}'. Unique constraint violation.")

        center = self.store.centers.get(rec.center_id)
        receipt = Receipt(
            receipt_id=uuid4(),
            record_id=record_id,
            receipt_reference=v_receipt_ref,
            issued_by_center_id=rec.center_id,
            issuance_date=date.today(),
            verification_code=v_verif_code,
            created_at=datetime.utcnow(),
            center_name=center.name if center else None,
            center_address=center.address if center else None,
            weight_kg=rec.weight_kg,
            user_id=rec.user_id,
        )
        self.store.receipts[record_id] = receipt
        self.store.receipt_references[v_receipt_ref] = receipt
        rec.receipt_reference = v_receipt_ref

        # Award points in points_ledger (Guaranteed max 1 entry per record)
        ledger_entry = PointsLedgerEntry(
            ledger_id=uuid4(),
            user_id=rec.user_id,
            record_id=record_id,
            transaction_type="recycling_award",
            points=points_calc,
            idempotency_key=f"award_{record_id}",
            notes=f"Points awarded for recycling record {record_id} ({rec.weight_kg} kg)",
            created_at=datetime.utcnow(),
        )
        self.store.ledger.append(ledger_entry)
        self.store.ledger_by_record[record_id] = ledger_entry

        return {
            "success": True,
            "status": "approved",
            "record_id": record_id,
            "points_awarded": points_calc,
            "already_awarded": False,
            "receipt_reference": v_receipt_ref,
            "message": "Record approved, receipt generated, and points awarded successfully."
        }

    async def reject_record(self, record_id: UUID, reviewer_id: UUID, reason: str) -> RecyclingRecord:
        rec = self.store.records.get(record_id)
        if not rec:
            raise ValueError(f"Record {record_id} not found.")
        old_status = rec.status
        rec.status = "rejected"
        rec.notes = (rec.notes or "") + f" | Rejection reason: {reason}"
        rec.updated_at = datetime.utcnow()

        self.store.record_history.append(RecordStatusHistory(
            history_id=uuid4(),
            record_id=record_id,
            old_status=old_status,
            new_status="rejected",
            changed_by=reviewer_id,
            reason=reason,
            changed_at=datetime.utcnow(),
        ))
        return rec

    async def get_receipt_by_record_id(self, record_id: UUID) -> Optional[Receipt]:
        return self.store.receipts.get(record_id)

    async def get_receipt_by_reference(self, reference: str) -> Optional[Receipt]:
        return self.store.receipt_references.get(reference)

    async def get_record_status_history(self, record_id: UUID) -> List[RecordStatusHistory]:
        return [h for h in self.store.record_history if h.record_id == record_id]


class MockPointsRepo(PointsRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def get_user_balance(self, user_id: UUID) -> int:
        return sum(entry.points for entry in self.store.ledger if entry.user_id == user_id)

    async def get_user_ledger(self, user_id: UUID) -> List[PointsLedgerEntry]:
        user_entries = [e for e in self.store.ledger if e.user_id == user_id]
        return sorted(user_entries, key=lambda e: e.created_at, reverse=True)

    async def get_leaderboard(self, limit: int = 10) -> List[LeaderboardEntry]:
        user_stats: Dict[UUID, Dict[str, Any]] = {}
        for u in self.store.users.values():
            if u.role_id == 2:  # citizens only
                user_stats[u.id] = {
                    "user_id": u.id,
                    "full_name": u.full_name,
                    "total_points": 0,
                    "total_kg": 0.0,
                    "total_records": 0,
                }

        for entry in self.store.ledger:
            if entry.user_id in user_stats and entry.points > 0:
                user_stats[entry.user_id]["total_points"] += entry.points

        for rec in self.store.records.values():
            if rec.status == "approved" and rec.user_id in user_stats:
                user_stats[rec.user_id]["total_kg"] += rec.weight_kg
                user_stats[rec.user_id]["total_records"] += 1

        sorted_users = sorted(user_stats.values(), key=lambda x: (x["total_points"], x["total_kg"]), reverse=True)
        entries: List[LeaderboardEntry] = []
        for idx, u in enumerate(sorted_users[:limit], 1):
            entries.append(LeaderboardEntry(
                user_id=u["user_id"],
                full_name=u["full_name"],
                total_points=u["total_points"],
                total_kg=round(u["total_kg"], 2),
                total_records=u["total_records"],
                rank=idx,
            ))
        return entries

    async def get_user_badges(self, user_id: UUID) -> List[UserBadge]:
        return self.store.user_badges.get(user_id, [])

    async def list_all_badges(self) -> List[Badge]:
        return list(self.store.badges.values())

    async def evaluate_and_award_badges(self, user_id: UUID) -> List[UserBadge]:
        balance = await self.get_user_balance(user_id)
        records_count = sum(1 for r in self.store.records.values() if r.user_id == user_id and r.status == "approved")

        if user_id not in self.store.user_badges:
            self.store.user_badges[user_id] = []

        awarded: List[UserBadge] = []
        current_badge_ids = {b.badge_id for b in self.store.user_badges[user_id]}

        for badge in self.store.badges.values():
            if badge.badge_id not in current_badge_ids:
                if records_count >= badge.required_records and balance >= badge.required_points:
                    ub = UserBadge(
                        user_id=user_id,
                        badge_id=badge.badge_id,
                        code=badge.code,
                        name=badge.name,
                        description=badge.description,
                        icon_name=badge.icon_name,
                        awarded_at=datetime.utcnow(),
                    )
                    self.store.user_badges[user_id].append(ub)
                    awarded.append(ub)
        return self.store.user_badges[user_id]


class MockRewardsRepo(RewardsRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def list_active_rewards(self) -> List[Reward]:
        return sorted([r for r in self.store.rewards.values() if r.is_active], key=lambda r: r.points_cost)

    async def get_by_id(self, reward_id: UUID) -> Optional[Reward]:
        return self.store.rewards.get(reward_id)

    async def create_reward(self, title: str, description: Optional[str], points_cost: int, stock_quantity: int, is_active: bool = True) -> Reward:
        r_id = uuid4()
        reward = Reward(
            reward_id=r_id,
            title=title,
            description=description,
            points_cost=points_cost,
            stock_quantity=stock_quantity,
            is_active=is_active,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.store.rewards[r_id] = reward
        return reward

    async def update_reward(self, reward_id: UUID, title: Optional[str] = None, description: Optional[str] = None, points_cost: Optional[int] = None, stock_quantity: Optional[int] = None, is_active: Optional[bool] = None) -> Optional[Reward]:
        rew = self.store.rewards.get(reward_id)
        if not rew:
            return None
        if title is not None:
            rew.title = title
        if description is not None:
            rew.description = description
        if points_cost is not None:
            rew.points_cost = points_cost
        if stock_quantity is not None:
            rew.stock_quantity = stock_quantity
        if is_active is not None:
            rew.is_active = is_active
        rew.updated_at = datetime.utcnow()
        return rew

    async def redeem_reward(self, user_id: UUID, reward_id: UUID, idempotency_key: str) -> Dict[str, Any]:
        """
        Emulates 007_functions.sql redeem_reward_transaction exactly:
        - Idempotency replay check
        - Out of stock / inactive check
        - Balance check
        - Decrements stock
        - Debits points in ledger
        """
        if idempotency_key in self.store.redemption_idempotency:
            existing = self.store.redemption_idempotency[idempotency_key]
            balance = sum(e.points for e in self.store.ledger if e.user_id == user_id)
            rew = self.store.rewards.get(existing.reward_id)
            return {
                "success": True,
                "redemption_id": existing.redemption_id,
                "reward_id": existing.reward_id,
                "reward_title": rew.title if rew else "Redeemed Reward",
                "points_spent": existing.points_spent,
                "remaining_balance": balance,
                "idempotent_replay": True,
                "message": "Reward was previously redeemed with this idempotency key."
            }

        reward = self.store.rewards.get(reward_id)
        if not reward:
            raise ValueError(f"Reward {reward_id} does not exist.")
        if not reward.is_active:
            raise ValueError(f"Reward '{reward.title}' is currently not active.")
        if reward.stock_quantity <= 0:
            raise ValueError(f"Reward '{reward.title}' is out of stock.")

        balance = sum(e.points for e in self.store.ledger if e.user_id == user_id)
        if balance < reward.points_cost:
            raise ValueError(f"Current balance {balance} is less than required {reward.points_cost} points.")

        # Decrement stock
        reward.stock_quantity -= 1
        reward.updated_at = datetime.utcnow()

        # Add debit ledger entry
        self.store.ledger.append(PointsLedgerEntry(
            ledger_id=uuid4(),
            user_id=user_id,
            record_id=None,
            transaction_type="reward_redemption",
            points=-reward.points_cost,
            idempotency_key=f"ledger_redeem_{idempotency_key}",
            notes=f"Redeemed reward: {reward.title}",
            created_at=datetime.utcnow(),
        ))

        # Record redemption
        redemption_id = uuid4()
        redemption = Redemption(
            redemption_id=redemption_id,
            user_id=user_id,
            reward_id=reward_id,
            points_spent=reward.points_cost,
            status="completed",
            idempotency_key=idempotency_key,
            redeemed_at=datetime.utcnow(),
            reward_title=reward.title,
            reward_description=reward.description,
        )
        self.store.redemptions[redemption_id] = redemption
        self.store.redemption_idempotency[idempotency_key] = redemption

        return {
            "success": True,
            "redemption_id": redemption_id,
            "reward_title": reward.title,
            "points_spent": reward.points_cost,
            "remaining_balance": balance - reward.points_cost,
            "idempotent_replay": False,
            "message": "Reward successfully redeemed."
        }

    async def list_user_redemptions(self, user_id: UUID) -> List[Redemption]:
        user_reds = [r for r in self.store.redemptions.values() if r.user_id == user_id]
        return sorted(user_reds, key=lambda r: r.redeemed_at, reverse=True)


class MockAnalyticsRepo(AnalyticsRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def get_user_metrics(self, user_id: UUID) -> Dict[str, Any]:
        approved_records = [r for r in self.store.records.values() if r.user_id == user_id and r.status == "approved"]
        total_kg = sum(r.weight_kg for r in approved_records)
        total_units = sum(r.estimated_units for r in approved_records)
        balance = sum(e.points for e in self.store.ledger if e.user_id == user_id)
        earned_points = sum(e.points for e in self.store.ledger if e.user_id == user_id and e.points > 0)

        # Estimated recovered materials based on category compositions
        recovered_materials: Dict[str, float] = {}
        for r in approved_records:
            mats = self.store.category_materials.get(r.category_id, [])
            for m in mats:
                est_kg = r.weight_kg * (m.estimated_percentage / 100.0)
                recovered_materials[m.name] = recovered_materials.get(m.name, 0.0) + est_kg

        return {
            "measured": {
                "total_recycled_kg": round(total_kg, 2),
                "total_units_recycled": total_units,
                "verified_submissions_count": len(approved_records),
            },
            "points": {
                "current_balance": balance,
                "lifetime_earned": earned_points,
            },
            "estimates": {
                "materials_recovered_kg": {k: round(v, 3) for k, v in recovered_materials.items()},
                "ghg_avoided_kg_co2e": round(total_kg * 1.44, 2),  # Documented factor: ~1.44 kg CO2e per kg e-waste diverted
            }
        }

    async def get_community_metrics(self) -> Dict[str, Any]:
        approved = [r for r in self.store.records.values() if r.status == "approved"]
        total_kg = sum(r.weight_kg for r in approved)
        total_units = sum(r.estimated_units for r in approved)
        active_citizens = len({r.user_id for r in approved})

        return {
            "measured": {
                "community_recycled_kg": round(total_kg, 2),
                "community_devices_count": total_units,
                "participating_citizens": active_citizens,
                "verified_centers_count": len([c for c in self.store.centers.values() if c.current_verification_status == "verified"]),
            },
            "estimates": {
                "total_ghg_avoided_kg_co2e": round(total_kg * 1.44, 2),
                "landfill_space_saved_m3": round(total_kg * 0.0018, 3),
            }
        }

    async def get_category_metrics(self) -> List[Dict[str, Any]]:
        breakdown: Dict[UUID, Dict[str, Any]] = {}
        for cat in self.store.categories.values():
            breakdown[cat.category_id] = {
                "category_id": cat.category_id,
                "name": cat.name,
                "code": cat.code,
                "total_kg": 0.0,
                "submissions_count": 0,
            }

        for r in self.store.records.values():
            if r.status == "approved" and r.category_id in breakdown:
                breakdown[r.category_id]["total_kg"] += r.weight_kg
                breakdown[r.category_id]["submissions_count"] += 1

        return list(breakdown.values())


class MockDevicePhotoRepo(DevicePhotoRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def save_photo_metadata(self, photo_meta: DevicePhotoMeta) -> DevicePhotoMeta:
        self.store.device_photos[photo_meta.photo_id] = photo_meta
        return photo_meta

    async def get_photo_metadata(self, photo_id: UUID) -> Optional[DevicePhotoMeta]:
        return self.store.device_photos.get(photo_id)


class MockAIAnalysisRepo(AIAnalysisRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def save_analysis_report(self, report: AIAnalysisReport) -> AIAnalysisReport:
        self.store.ai_reports[report.report_id] = report
        return report

    async def get_report_by_photo(self, photo_id: UUID) -> Optional[AIAnalysisReport]:
        for rep in self.store.ai_reports.values():
            if rep.photo_id == photo_id:
                return rep
        return None


class MockCenterDocsRepo(CenterDocsRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def save_center_doc(self, doc: CenterDocMeta) -> CenterDocMeta:
        self.store.center_docs.append(doc)
        return doc

    async def list_docs_for_center(self, center_id: UUID) -> List[CenterDocMeta]:
        return [d for d in self.store.center_docs if d.center_id == center_id]


class MockActivityEventsRepo(ActivityEventsRepoBase):
    def __init__(self):
        self.store = get_mock_store()

    async def record_event(self, event: ActivityEvent) -> ActivityEvent:
        self.store.activity_events.append(event)
        return event

    async def list_recent_events(self, limit: int = 50) -> List[ActivityEvent]:
        return sorted(self.store.activity_events, key=lambda e: e.timestamp, reverse=True)[:limit]
