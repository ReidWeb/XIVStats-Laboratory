using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Reflection.PortableExecutable;
using System.Threading.Tasks;
using HtmlAgilityPack;

namespace Async
{
	class Program
	{
		private static int START_ID = 0;
		private static int END_ID = 100;
		private static List<Task> tasks = new List<Task>();

		static void Main(string[] args)
		{
			for (int i = START_ID; i <= END_ID; i++)
			{
				tasks.Add(ProcessCharacter(i));
			}

			Task.WaitAll(tasks.ToArray());

			Console.WriteLine("Done");
		}


		private static async Task<string> ProcessCharacter(int id)
		{
			try
			{
				var client = new HttpClient();
				client.DefaultRequestHeaders.Add("User-Agent", "FFXIV Census Gatherer Prototype");

				var url = "http://eu.finalfantasyxiv.com/lodestone/character/" + id;

				HttpResponseMessage result = await client.GetAsync(url);

				if (result.StatusCode == System.Net.HttpStatusCode.OK)
				{
					Stream stream = await result.Content.ReadAsStreamAsync();

					HtmlDocument doc = new HtmlDocument();

					doc.Load(stream);

					HtmlNode title = doc.DocumentNode.SelectSingleNode("//head/title");
//					Console.WriteLine(id + ", " + title.InnerText.Split('|')[0]);
					return title.InnerText.Split('|')[0];
				}
				else if (result.StatusCode.ToString() == "429")
				{
					Console.WriteLine("Encountered 429 on character " + id + ", retrying");
					return await ProcessCharacter(id);
				}
			}
			catch (HttpRequestException exception)
			{
				Console.WriteLine(exception.Message);
				if (exception.Message.Contains("429"))
				{
					Console.WriteLine("Encountered 429 on character " + id + ", retrying");
					return await ProcessCharacter(id);
				}
			}

			return "error";
		}
	}
}
