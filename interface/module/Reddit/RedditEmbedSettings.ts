/**
 * Settings related to how the post from this reddit should be sent
 */
export interface RedditEmbedSettings {
    /**
     * Name of the reddit page
     */
    reddit_name: string,

    /**
     * Should the image of the post be sent
     */
    include_image: boolean
}