/**
 * Object containing result of anime query to MAL
 */

export interface AnimeDetails {
	id?: number;
	title?: string;
	main_picture?: any;
	alternative_titles?: any;
	start_date?: string;
	end_date?: string;
	synopsis?: string;
	mean?: number;
	rank?: number;
	popularity?: number;
	num_list_users?: number;
	num_scoring_users?: number;
	nsfw?: string;
	genres?: Array<any>;
	created_at?: string;
	updated_at?: string;
	media_type?: "tv" | "ova" | "movie" | "special" | "ona" | "music";
	status?: string;
	my_list_status?: any;
	num_episodes?: number;
	start_season?: any;
	broadcast?: any;
	source?: string;
	average_episode_duration?: number;
	rating?: string;
	studios?: Array<any>;
	pictures?: Array<any>;
	background?: string;
	related_anime?: Array<any>;
	related_manga?: Array<any>;
	recommendations?: Array<any>;
	statistics?: any;
}

export interface AnimeQueryObject {
	status: boolean;
	anime_details: AnimeDetails;
	err: string;
}
