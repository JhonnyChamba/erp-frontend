import { api } from '@/services/axios';

export interface PositionItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  name: string;
  code?: string;
  scope: 'TOURNAMENT' | 'TEAM' | 'ARBITRAL';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface DemarcationItem {
  id: string;
  companyId?: number;
  name: string;
  code: string;
  zone: 'GOALKEEPER' | 'DEFENDER' | 'MIDFIELDER' | 'FORWARD';
  order: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  name: string;
  shortName?: string;
  logo?: string;
  color1: string;
  color2?: string;
  colorAlternate?: string;
  dateOfFoundation?: string;
  acronyms: string;
  email?: string;
  representativePhone?: string;
  city?: string;
  neighborhood?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  demarcationId?: string;
  demarcation?: DemarcationItem;
  playerClassificationId?: string;
  playerClassification?: PlayerClassificationItem;
  name: string;
  lastName: string;
  identification: string;
  isForeigner: boolean;
  birthDate?: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  jerseyNumber?: number;
  address?: string;
  phone?: string;
  email?: string;
  photo?: string;
  bloodType?: string;
  dominantFoot?: 'RIGHT' | 'LEFT' | 'BOTH';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalClearanceExpiry?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  name: string;
  description?: string;
  code?: string;
  gender: 'MALE' | 'FEMALE' | 'MIXED';
  minAge?: number;
  maxAge?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface EditionCategoryClassificationItem {
  id?: string;
  categoryDetailId?: string;
  playerClassificationId: string;
  playerClassification?: PlayerClassificationItem;
  maxPlayers: number;
}

export interface EditionCategoryDetailItem {
  id?: string;
  companyId?: number;
  tournamentId?: string;
  editionId?: string;
  categoryId: string;
  category?: CategoryItem;
  categoryDescription?: string;
  startDate?: string;
  endDate?: string;
  registrationFee?: number;
  maxPlayers?: number;
  classifications?: EditionCategoryClassificationItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryEditionItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  categoryId?: string;
  category?: CategoryItem;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  minPlayersPerMatch: number;
  registrationFee: number;
  guaranteeFee: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  categoriesDetail?: EditionCategoryDetailItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface StageItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  categoryEditionId: string;
  categoryEdition?: CategoryEditionItem;
  name: string;
  description?: string;
  stageOrder: number;
  teamOrigin: 'FULL_CATEGORY' | 'PREVIOUS_STAGE';
  previousStageId?: string;
  numberOfExpectedTeams: number;
  format: 'EVERYONE_AGAINST_EVERYONE' | 'DIRECT_ELIMINATION' | 'DOUBLE_ELIMINATION';
  numberOfLaps: number;
  numberOfGroups?: number;
  intersectionType: 'PREVIOUS_RANKING' | 'RANDOM_DRAW' | 'FIXED_BRACKET';
  predefinedCrosses?: any;
  matchDurationMinutes: number;
  maxPlayersPerTeam?: number;
  allowExtraTime: boolean;
  allowPenalties: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerClassificationItem {
  id: string;
  companyId?: number;
  description: string;
  code?: string;
  observation?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ScenaryItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  name: string;
  location?: string;
  code?: string;
  surfaceType: 'NATURAL_GRASS' | 'SYNTHETIC' | 'DIRT' | 'PARQUET_CONCRETE';
  hasLighting: boolean;
  googleMapsUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamRegistrationItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  categoryEditionId: string;
  categoryEdition?: CategoryEditionItem;
  teamId: string;
  team?: TeamItem;
  groupName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISQUALIFIED';
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  pointsPenalty: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PlayerRegistrationItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  teamRegistrationId: string;
  teamRegistration?: TeamRegistrationItem;
  playerId: string;
  player?: PlayerItem;
  stageId?: string;
  stage?: StageItem;
  playerClassificationId?: string;
  playerClassification?: PlayerClassificationItem;
  jerseyNumber: number;
  carnetCode?: string;
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'SUSPENDED' | 'TRANSFERRED';
  isCaptain: boolean;
  registrationDate: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RefereeGuildItem {
  id: string;
  description: string;
  acronyms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface RefereeItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  guildId?: string;
  guild?: RefereeGuildItem;
  name: string;
  lastName: string;
  identification: string;
  phone?: string;
  email?: string;
  category?: string;
  isActive: boolean;
  companyRefereeId?: string;
  isActiveInCompany?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface VocalItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  teamId?: string;
  team?: TeamItem;
  name: string;
  lastName: string;
  identification: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  stageId: string;
  stage?: StageItem;
  scenaryId?: string;
  scenary?: ScenaryItem;
  localTeamId: string;
  localTeam?: TeamItem;
  awayTeamId: string;
  awayTeam?: TeamItem;
  date: string;
  roundNumber?: number;
  homeGoals: number;
  awayGoals: number;
  homeExtraGoals?: number;
  awayExtraGoals?: number;
  homePenalties?: number;
  awayPenalties?: number;
  winnerTeamId?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED' | 'WALKOVER';
  meetingType: 'UNICO' | 'IDA' | 'VUELTA';
  llaveId?: string;
  isWalkover: boolean;
  refereeId?: string;
  referee?: RefereeItem;
  vocalId?: string;
  vocal?: VocalItem;
  vocalTeamId?: string;
  vocalTeam?: TeamItem;
  vocalMemberName?: string;
  vocalObservations?: string;
  refereeObservations?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchLineupItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  matchId: string;
  match?: MatchItem;
  teamId: string;
  team?: TeamItem;
  playerId: string;
  player?: PlayerItem;
  stageId?: string;
  stage?: StageItem;
  playerClassificationId?: string;
  playerClassification?: PlayerClassificationItem;
  jerseyNumber: number;
  isStarter: boolean;
  isCaptain: boolean;
  hasPlayed: boolean;
  minutesPlayed: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MatchEventItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  matchId: string;
  match?: MatchItem;
  teamId: string;
  team?: TeamItem;
  playerId: string;
  player?: PlayerItem;
  eventType: 'GOAL' | 'PENALTY_GOAL' | 'OWN_GOAL' | 'MISSED_PENALTY' | 'YELLOW_CARD' | 'SECOND_YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'INJURY';
  minute?: number;
  extraMinute?: number;
  playerOutId?: string;
  playerOut?: PlayerItem;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SanctionItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  matchId?: string;
  match?: MatchItem;
  playerId: string;
  player?: PlayerItem;
  type: 'YELLOW_CARD_ACCUMULATION' | 'RED_CARD_DIRECT' | 'DOUBLE_YELLOW' | 'PHYSICAL_AGGRESSION' | 'VERBAL_AGGRESSION' | 'REGULATION_INFRACTION';
  matchesSuspended: number;
  matchesServed: number;
  fineAmount: number;
  status: 'PENDING' | 'SERVED' | 'PARDONED' | 'APPEALED';
  description?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  teamRegistrationId?: string;
  teamRegistration?: TeamRegistrationItem;
  concept: 'REGISTRATION_FEE' | 'GUARANTEE_FEE' | 'MATCH_ARBITRATION' | 'SANCTION_FINE' | 'CARNET_ISSUANCE' | 'OTHER';
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'ONLINE_GATEWAY';
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  receiptNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TournamentCommitteeItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  positionId: string;
  position?: PositionItem;
  name: string;
  lastName: string;
  identification: string;
  cellphone?: string;
  email?: string;
  address?: string;
  photo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TeamManagementItem {
  id: string;
  companyId?: number;
  tournamentId?: string;
  positionId?: string;
  position?: PositionItem;
  roleTitle?: string;
  teamId: string;
  team?: TeamItem;
  playerId?: string;
  player?: PlayerItem;
  name: string;
  lastName: string;
  identification: string;
  cellphone?: string;
  email?: string;
  address?: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const withCompany = (companyId?: number) => (companyId ? { headers: { 'x-company-id': String(companyId) } } : {});

export const createCrudService = <T>(endpoint: string) => ({
  list: (params?: { page?: number; limit?: number; search?: string; [key: string]: any }, companyId?: number) =>
    api.get<PaginatedResponse<T>>(`/campeonato/${endpoint}`, { params, ...withCompany(companyId) }),
  get: (id: string, companyId?: number) =>
    api.get<T>(`/campeonato/${endpoint}/${id}`, withCompany(companyId)),
  create: (data: Partial<T>, companyId?: number) =>
    api.post<T>(`/campeonato/${endpoint}`, data, withCompany(companyId)),
  update: (id: string, data: Partial<T>, companyId?: number) =>
    api.patch<T>(`/campeonato/${endpoint}/${id}`, data, withCompany(companyId)),
  delete: (id: string, companyId?: number) =>
    api.delete<{ raw: any; affected?: number }>(`/campeonato/${endpoint}/${id}`, withCompany(companyId)),
});

export const PositionsService = createCrudService<PositionItem>('positions');
export const DemarcationsService = createCrudService<DemarcationItem>('demarcations');
export const TeamsService = createCrudService<TeamItem>('teams');
export const PlayersService = {
  ...createCrudService<PlayerItem>('players'),
  findGlobal: (identification: string, companyId?: number) =>
    api.get<{ exists: boolean; player: any; isLinkedToCurrentCompany?: boolean }>(
      `/campeonato/players/find-global/${encodeURIComponent(identification.trim())}`,
      withCompany(companyId)
    ),
};
export const CategoriesService = createCrudService<CategoryItem>('categories');
export const CategoryEditionsService = createCrudService<CategoryEditionItem>('category-editions');
export const StagesService = {
  ...createCrudService<StageItem>('stages'),
  listClassifications: (stageId: string, companyId?: number) =>
    api.get<{
      stageId: string;
      stageName: string;
      maxPlayersPerTeam?: number;
      totalDistributed: number;
      remainingSlots: number | null;
      data: any[];
    }>(`/campeonato/stages/${stageId}/classifications`, withCompany(companyId)),
  addClassification: (stageId: string, data: { playerClassificationId: string; maxPlayers: number }, companyId?: number) =>
    api.post<any>(`/campeonato/stages/${stageId}/classifications`, data, withCompany(companyId)),
  updateClassification: (classificationId: string, data: { maxPlayers: number }, companyId?: number) =>
    api.put<any>(`/campeonato/stages/classifications/${classificationId}`, data, withCompany(companyId)),
  removeClassification: (classificationId: string, companyId?: number) =>
    api.delete<any>(`/campeonato/stages/classifications/${classificationId}`, withCompany(companyId)),
};
export const ScenariesService = createCrudService<ScenaryItem>('scenaries');
export const PlayerClassificationsService = createCrudService<PlayerClassificationItem>('player-classifications');
export const TeamRegistrationsService = createCrudService<TeamRegistrationItem>('team-registrations');
export const PlayerRegistrationsService = {
  ...createCrudService<PlayerRegistrationItem>('player-registrations'),
  massCreate: (data: { teamRegistrationId: string; stageId?: string; registrations: any[] }, companyId?: number) =>
    api.post<any>('/campeonato/player-registrations/mass', data, withCompany(companyId)),
  updateStatus: (id: string, data: { status: string; comments?: string }, companyId?: number) =>
    api.patch<any>(`/campeonato/player-registrations/${id}/status`, data, withCompany(companyId)),
  getRoster: (teamRegistrationId: string, companyId?: number) =>
    api.get<any>(`/campeonato/player-registrations/roster/${teamRegistrationId}`, withCompany(companyId)),
};
export const RefereeGuildsService = createCrudService<RefereeGuildItem>('referee-guilds');
export const RefereesService = {
  ...createCrudService<RefereeItem>('referees'),
  findGlobal: (identification: string, companyId?: number) =>
    api.get<{
      exists: boolean;
      referee: RefereeItem | null;
      isLinkedToCurrentCompany: boolean;
    }>(`/campeonato/referees/find-global/${encodeURIComponent(identification)}`, withCompany(companyId)),
};
export const VocalsService = createCrudService<VocalItem>('vocals');
export const MatchesService = {
  ...createCrudService<MatchItem>('matches'),
  getStandings: (stageId?: string, companyId?: number) =>
    api.get<{ standings: any[]; topScorers: any[]; totalMatchesPlayed: number }>('/campeonato/matches/standings', {
      params: { stageId },
      ...withCompany(companyId),
    }),
  generateFixture: (
    data: { stageId: string; teamIds: string[]; scenaryId?: string; startDate: string; matchDurationMinutes?: number; intervalDays?: number; numberOfLaps?: number },
    companyId?: number
  ) =>
    api.post<{ success: boolean; message: string; matchesCount: number; roundsCount: number }>('/campeonato/matches/generate-fixture', data, withCompany(companyId)),
};
export const MatchLineupsService = createCrudService<MatchLineupItem>('match-lineups');
export const MatchEventsService = createCrudService<MatchEventItem>('match-events');
export const SanctionsService = createCrudService<SanctionItem>('sanctions');
export const PaymentsService = createCrudService<PaymentItem>('payments');
export const TournamentCommitteesService = createCrudService<TournamentCommitteeItem>('committees');
export const TeamManagementsService = {
  ...createCrudService<TeamManagementItem>('team-managements'),
  listByTeam: (teamId: string, companyId?: number) =>
    api.get<TeamManagementItem[]>(`/campeonato/team-managements/by-team/${teamId}`, withCompany(companyId)),
};

export const uploadTeamLogo = async (file: File, companyId?: number): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ url: string }>('/storage/team-logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...withCompany(companyId).headers },
    params: companyId ? { companyId } : undefined,
  });
  return data.url;
};

export const uploadPlayerPhoto = async (file: File, companyId?: number): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<{ url: string }>('/storage/player-photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...withCompany(companyId).headers },
    params: companyId ? { companyId } : undefined,
  });
  return data.url;
};

export const TeamCategoryHistoryService = {
  listByTeam: (teamId: string, companyId?: number) =>
    api.get<any[]>(`/campeonato/team-category-history/${teamId}`, withCompany(companyId)),
  create: (data: any, companyId?: number) =>
    api.post<any>('/campeonato/team-category-history', data, withCompany(companyId)),
  delete: (id: string, companyId?: number) =>
    api.delete<any>(`/campeonato/team-category-history/${id}`, withCompany(companyId)),
};

export const PlayerTransfersService = {
  ...createCrudService<any>('player-transfers'),
  listByPlayer: (playerId: string, companyId?: number) =>
    api.get<any[]>(`/campeonato/player-transfers/player/${playerId}`, withCompany(companyId)),
  getSportsHistory: (playerId: string, companyId?: number) =>
    api.get<any>(`/campeonato/player-transfers/sports-history/${playerId}`, withCompany(companyId)),
  createRequest: (data: any, companyId?: number) =>
    api.post<any>('/campeonato/player-transfers', data, withCompany(companyId)),
  approve: (id: string, data: { role: string; status: string; comments?: string }, companyId?: number) =>
    api.post<any>(`/campeonato/player-transfers/${id}/approve`, data, withCompany(companyId)),
  execute: (id: string, companyId?: number) =>
    api.post<any>(`/campeonato/player-transfers/${id}/execute`, {}, withCompany(companyId)),
};

export const TournamentTransferConfigsService = {
  getByEdition: (editionId: string, companyId?: number) =>
    api.get<any>(`/campeonato/tournament-transfer-configs/${editionId}`, withCompany(companyId)),
  upsert: (editionId: string, data: any, companyId?: number) =>
    api.put<any>(`/campeonato/tournament-transfer-configs/${editionId}`, data, withCompany(companyId)),
};

export const CampeonatoApi = {
  positions: PositionsService,
  demarcations: DemarcationsService,
  teams: TeamsService,
  players: PlayersService,
  categories: CategoriesService,
  categoryEditions: CategoryEditionsService,
  stages: StagesService,
  scenaries: ScenariesService,
  teamRegistrations: TeamRegistrationsService,
  playerRegistrations: PlayerRegistrationsService,
  referees: RefereesService,
  refereeGuilds: RefereeGuildsService,
  vocals: VocalsService,
  matches: MatchesService,
  matchLineups: MatchLineupsService,
  matchEvents: MatchEventsService,
  sanctions: SanctionsService,
  payments: PaymentsService,
  committees: TournamentCommitteesService,
  teamManagements: TeamManagementsService,
  teamCategoryHistory: TeamCategoryHistoryService,
  playerTransfers: PlayerTransfersService,
  playerClassifications: PlayerClassificationsService,
  tournamentTransferConfigs: TournamentTransferConfigsService,
};

export const campeonatoService = {
  ...CampeonatoApi,
  getTournamentTransferConfig: (editionId: string, companyId?: number) =>
    TournamentTransferConfigsService.getByEdition(editionId, companyId).then((r: any) => r.data),
  saveTournamentTransferConfig: (payload: any, companyId?: number) =>
    TournamentTransferConfigsService.upsert(payload.edition_id, payload, companyId).then((r: any) => r.data),
  approveTransfer: (id: string, data: any, companyId?: number) =>
    PlayerTransfersService.approve(id, data, companyId).then((r: any) => r.data),
  executeTransfer: (id: string, companyId?: number) =>
    PlayerTransfersService.execute(id, companyId).then((r: any) => r.data),
  getSportsHistory: (playerId: string, companyId?: number) =>
    PlayerTransfersService.getSportsHistory(playerId, companyId).then((r: any) => r.data),
  getRosterByTeamRegistration: (teamRegId: string, companyId?: number) =>
    PlayerRegistrationsService.getRoster(teamRegId, companyId).then((r: any) => r.data),
  registerMass: (payload: any, companyId?: number) =>
    PlayerRegistrationsService.massCreate(payload, companyId).then((r: any) => r.data),
  updateRegistrationStatus: (id: string, payload: any, companyId?: number) =>
    PlayerRegistrationsService.updateStatus(id, payload, companyId).then((r: any) => r.data),
};
